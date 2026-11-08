"""Walk the whole family flow on a phone-sized screen and save screenshots.

Forces demo mode (no Supabase calls) by serving a blank config, so it never touches the live game.
Needs: pip install playwright && playwright install chromium
Run:   python3 -m http.server -d app 8000   (in another terminal)
       python3 tools/test_flow.py
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000/"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "test-shots")
OUT.mkdir(parents=True, exist_ok=True)
errors = []


def shot(page, name):
    page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.route("**/js/config.js", lambda route: route.fulfill(content_type="application/javascript",
        body="window.CONFIG = {supabaseUrl: \"\", supabaseAnonKey: \"\", demoTools: true, locationEveryMs: 30000};"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.goto(BASE)
    page.wait_for_selector(".plate")
    shot(page, "01-start")

    page.click("text=Sign up your family")
    page.fill("input[name=name]", "The Rose Family")
    names = page.locator("input[name=agentName]")
    ages = page.locator("input[name=agentAge]")
    names.nth(0).fill("Emmett"); ages.nth(0).fill("10")
    names.nth(1).fill("Colby"); ages.nth(1).fill("5")
    page.fill("input[name=weddingYear]", "2012")
    page.fill("input[name=pet]", "Biscuit")
    shot(page, "02-signup")
    page.click("text=Create our team")
    page.wait_for_selector(".code-big")
    shot(page, "03-created")
    page.click("text=Continue")

    page.wait_for_selector("#ans")
    page.fill("#ans", "5309")
    page.click("text=Unlock the briefing")
    page.wait_for_timeout(200)
    shot(page, "04-kickoff-wrong")
    page.fill("#ans", "5,320")
    page.click("text=Unlock the briefing")
    page.wait_for_selector("#radio-text")
    page.wait_for_timeout(1500)
    shot(page, "05-briefing-typing")
    page.click("text=Next transmission")
    page.wait_for_timeout(300)
    page.click("text=Start your route")
    page.wait_for_selector(".lamps")
    shot(page, "06-board")

    answers = page.evaluate("window.DEMO_ANSWERS")
    team = page.evaluate("JSON.parse(localStorage.getItem('roothog.state.v1')).team")
    route = team["route"]
    demo_team = page.evaluate("JSON.parse(localStorage.getItem('roothog.demo.teams'))")[team["code"]]
    print("route:", route)

    def solve(rid, first=False):
        if rid != "family":
            page.click("text=We're here")
        page.wait_for_selector(".junior, .clue")
        page.wait_for_timeout(400)
        if first:
            shot(page, f"07-relay-{rid}")
            page.fill("#ans", "999")
            page.click(".clue >> text=Check")
            page.wait_for_timeout(150)
            page.click("text=Get a hint")
        main = demo_team["familyClue"]["answer"] if rid == "family" else answers["relays"][rid]["main"]
        page.fill("#ans", main)
        page.click(".clue >> text=Check")
        page.wait_for_selector(".clue.solved")
        j = page.locator(".junior")
        if j.count() and not page.locator(".junior.solved").count():
            if page.locator(".junior [data-action=junior]").count():
                page.click(".junior [data-v=torpedo]")
            elif page.locator("#jans").count():
                page.fill("#jans", answers["relays"][rid]["junior"])
                page.click(".junior >> text=Check")
            else:
                page.locator(".junior [data-action=junior-any]").first.click()
        page.wait_for_selector(".restored-screen")
        if first:
            shot(page, f"08-restored-{rid}")

    for i, rid in enumerate(route):
        page.click("text=Relay board") if page.locator(".restored-screen").count() else None
        page.wait_for_selector(".lamps")
        if i == 0:
            page.click(f"[data-action=open-relay][data-id={rid}] >> nth=0")
        else:
            page.click(f".stack [data-action=open-relay][data-id={rid}]")
        solve(rid, first=(i == 0))
        if i == 2:
            page.click("text=Relay board")
            page.wait_for_selector(".lamps")
            shot(page, "09-board-family-unlocked")
            page.click("text=Solve the Family Relay in the car")
            solve("family")

    shot(page, "10-last-restored")
    page.click("text=Head to the substation")
    page.wait_for_selector(".code-big.lock")
    shot(page, "11-finale-code")
    page.click("text=We're at the substation")
    for _ in range(6):
        page.click("[data-action=quiz] >> nth=0")
        page.wait_for_timeout(100)
    shot(page, "12-quiz-done")
    page.click("text=Throw the switch (demo)")
    page.wait_for_timeout(2500)
    shot(page, "13-victory")

    state = page.evaluate("JSON.parse(localStorage.getItem('roothog.state.v1'))")
    print("digits:", state["digits"], "score element:", page.locator(".lede").last.inner_text())
    browser.close()

print("ERRORS:", json.dumps(errors, indent=1) if errors else "none")
