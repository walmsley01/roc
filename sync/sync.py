#!/usr/bin/env python3
"""
ROC Garmin sync — fetches recent activities + wellness from Garmin Connect
(reusing the saved login tokens at ~/.garminconnect) and writes a compact
garmin-data.json that the ROC web app reads.

Run locally:    uv run --with garminconnect python sync/sync.py
Re-auth if it fails:  uvx garmin-connect-mcp auth
"""
import os, json, datetime, sys

TOKENSTORE   = os.path.expanduser("~/.garminconnect")
HERE         = os.path.dirname(os.path.abspath(__file__))
OUT_PATH     = os.path.normpath(os.path.join(HERE, "..", "garmin-data.json"))
ACT_DAYS     = 90      # activities window
WELL_DAYS    = 14      # wellness window


def fmt_duration(seconds):
    if not seconds:
        return None
    s = int(seconds)
    h, m = s // 3600, (s % 3600) // 60
    return f"{h}h {m:02d}m" if h else f"{m}m"


def pace_per_km(distance_m, seconds):
    if not distance_m or not seconds or distance_m < 50:
        return None
    return seconds / (distance_m / 1000.0)   # seconds per km


def fmt_pace(sec_per_km):
    if not sec_per_km:
        return None
    m, s = int(sec_per_km // 60), int(round(sec_per_km % 60))
    if s == 60:
        m, s = m + 1, 0
    return f"{m}:{s:02d} /km"


def z2_pct(a):
    zones = [a.get(f"hrTimeInZone_{i}") or 0 for i in range(1, 6)]
    total = sum(zones)
    if total <= 0:
        return None
    return round(zones[1] / total * 100)


def main():
    try:
        from garminconnect import Garmin
    except ImportError:
        sys.exit("garminconnect not installed — run with: uv run --with garminconnect python sync/sync.py")

    try:
        g = Garmin()
        g.login(TOKENSTORE)
    except Exception as e:
        sys.exit(f"Garmin login failed ({e}).\nRe-authenticate with: uvx garmin-connect-mcp auth")

    today = datetime.date.today()
    start = today - datetime.timedelta(days=ACT_DAYS)

    # ---- activities ----
    raw = g.get_activities_by_date(start.isoformat(), today.isoformat()) or []
    activities, maf, vo2 = [], [], {}
    for a in raw:
        dist_m = a.get("distance") or 0
        dur_s  = a.get("duration") or a.get("movingDuration") or 0
        date   = (a.get("startTimeLocal") or "")[:10]
        sp     = pace_per_km(dist_m, dur_s)
        avg_hr = round(a.get("averageHR")) if a.get("averageHR") else None
        typ    = (a.get("activityType") or {}).get("typeKey", "")
        act = {
            "id": a.get("activityId"),
            "type": typ,
            "date": date,
            "title": a.get("activityName"),
            "km": round(dist_m / 1000.0, 2) if dist_m else None,
            "duration": fmt_duration(dur_s),
            "avgHr": avg_hr,
            "pace": fmt_pace(sp) if "run" in typ else None,
            "elevation": round(a.get("elevationGain")) if a.get("elevationGain") else None,
            "z2pct": z2_pct(a),
            "load": round(a["activityTrainingLoad"]) if a.get("activityTrainingLoad") else None,
        }
        activities.append(act)
        # MAF data point: easy runs (avg HR in aerobic band)
        if "run" in typ and avg_hr and 135 <= avg_hr <= 162 and sp:
            maf.append({"date": date, "pace": round(sp)})
        # VO2max series (keep latest per day)
        if a.get("vO2MaxValue") and date:
            vo2[date] = round(a["vO2MaxValue"], 1)

    activities.sort(key=lambda x: x["date"] or "", reverse=True)
    maf.sort(key=lambda x: x["date"])
    vo2_series = [{"date": d, "value": v} for d, v in sorted(vo2.items())]

    # ---- wellness (best-effort, per day) ----
    wellness = {}
    for i in range(WELL_DAYS):
        d = (today - datetime.timedelta(days=i)).isoformat()
        w = {}
        try:
            st = g.get_stats(d) or {}
            if st.get("restingHeartRate"):        w["restingHr"] = round(st["restingHeartRate"])
            if st.get("bodyBatteryMostRecentValue") is not None: w["bodyBattery"] = st["bodyBatteryMostRecentValue"]
        except Exception:
            pass
        try:
            sl = (g.get_sleep_data(d) or {}).get("dailySleepDTO") or {}
            secs = sl.get("sleepTimeSeconds")
            if secs: w["sleepHours"] = round(secs / 3600.0, 1)
            score = ((sl.get("sleepScores") or {}).get("overall") or {}).get("value")
            if score: w["sleepScore"] = score
        except Exception:
            pass
        try:
            hrv = (g.get_hrv_data(d) or {}).get("hrvSummary") or {}
            if hrv.get("lastNightAvg"): w["hrv"] = hrv["lastNightAvg"]
            if hrv.get("status"):       w["hrvStatus"] = hrv["status"].lower()
        except Exception:
            pass
        if w:
            wellness[d] = w

    out = {
        "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
        "activities": activities,
        "wellness": wellness,
        "maf": maf,
        "vo2": vo2_series,
    }
    with open(OUT_PATH, "w") as f:
        json.dump(out, f, indent=1)
    print(f"Wrote {OUT_PATH}: {len(activities)} activities, {len(wellness)} wellness days, {len(maf)} MAF points")


if __name__ == "__main__":
    main()
