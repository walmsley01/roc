#!/usr/bin/env python3
"""
ROC deploy / data-sync helper.

  python3 sync/deploy.py            # full one-time deploy:
                                    #   secret gist + inject URL + create public
                                    #   code repo + push + enable Pages + nightly job
  python3 sync/deploy.py --sync     # data-only: create/update the secret gist
                                    #   (used by the nightly job)

Uses your already-cached GitHub login (osxkeychain) — no password needed.
Your health JSON goes ONLY to a *secret* gist (unguessable URL). The public
code repo never contains it (.gitignore).
"""
import os, re, sys, json, subprocess, urllib.request, urllib.error

ROOT    = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DATA    = os.path.join(ROOT, "garmin-data.json")
IDFILE  = os.path.join(ROOT, "sync", "gist_id.txt")
APPJS   = os.path.join(ROOT, "app.js")
REPO    = "roc"


def gh_token():
    p = subprocess.run(["git", "credential", "fill"],
                       input="protocol=https\nhost=github.com\n\n",
                       capture_output=True, text=True)
    for line in p.stdout.splitlines():
        if line.startswith("password="):
            return line[9:]
    sys.exit("No cached GitHub credential found. Run `git push` on liftr once, then retry.")


def api(url, method="GET", payload=None, token=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "roc-sync",
    })
    return json.load(urllib.request.urlopen(req))


def git(*args):
    subprocess.run(["git", *args], cwd=ROOT, check=True)


def sync_gist(token, owner):
    content = open(DATA).read()
    files = {"garmin-data.json": {"content": content}}
    if os.path.exists(IDFILE):
        gid = open(IDFILE).read().strip()
        api(f"https://api.github.com/gists/{gid}", "PATCH", {"files": files}, token)
        print(f"Updated gist {gid}")
    else:
        r = api("https://api.github.com/gists", "POST",
                {"description": "ROC training data (private)", "public": False, "files": files}, token)
        gid = r["id"]
        os.makedirs(os.path.dirname(IDFILE), exist_ok=True)
        open(IDFILE, "w").write(gid)
        print(f"Created secret gist {gid}")
    return f"https://gist.githubusercontent.com/{owner}/{gid}/raw/garmin-data.json"


def main():
    token = gh_token()
    owner = api("https://api.github.com/user", token=token)["login"]

    raw = sync_gist(token, owner)

    if "--sync" in sys.argv:
        return  # nightly path stops here

    # inject gist URL into app.js
    src = open(APPJS).read()
    src = re.sub(r"const GARMIN_URL = '[^']*';",
                 f"const GARMIN_URL = '{raw}';", src, count=1)
    open(APPJS, "w").write(src)
    print("Injected data URL into app.js")

    # git init + commit (garmin-data.json excluded by .gitignore)
    if not os.path.isdir(os.path.join(ROOT, ".git")):
        git("init"); git("branch", "-M", "main")
    git("config", "user.name", owner)
    git("config", "user.email", f"{owner}@users.noreply.github.com")
    git("add", "-A")
    subprocess.run(["git", "commit", "-m", "ROC training app"], cwd=ROOT)

    # create public code repo (idempotent)
    try:
        api("https://api.github.com/user/repos", "POST",
            {"name": REPO, "private": False, "description": "ROC England training app"}, token)
        print(f"Created repo {owner}/{REPO}")
    except urllib.error.HTTPError as e:
        print("repo:", "exists" if e.code == 422 else e.read().decode()[:200])

    subprocess.run(["git", "remote", "add", "origin",
                    f"https://github.com/{owner}/{REPO}.git"], cwd=ROOT)
    git("push", "-u", "origin", "main")

    # enable GitHub Pages (root of main)
    try:
        api(f"https://api.github.com/repos/{owner}/{REPO}/pages", "POST",
            {"source": {"branch": "main", "path": "/"}}, token)
        print("Pages enabled")
    except urllib.error.HTTPError as e:
        print("pages:", "already enabled" if e.code in (409, 422) else f"{e.code} {e.read().decode()[:200]}")

    # install nightly launchd job
    plist = os.path.join(ROOT, "sync", "com.roc.garminsync.plist")
    dest  = os.path.expanduser("~/Library/LaunchAgents/com.roc.garminsync.plist")
    subprocess.run(["cp", plist, dest])
    subprocess.run(["launchctl", "unload", dest], stderr=subprocess.DEVNULL)
    subprocess.run(["launchctl", "load", dest])
    print("Nightly sync installed (05:30 daily)")

    print(f"\n✅ Live at: https://{owner}.github.io/{REPO}/")
    print("   Open that on your phone → Share → Add to Home Screen.")


if __name__ == "__main__":
    main()
