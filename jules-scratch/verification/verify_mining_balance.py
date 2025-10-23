from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        time.sleep(10)
        page.goto("http://localhost:5173/")
        page.click('button:has-text("INITIATE MINING SEQUENCE")')
        page.wait_for_timeout(2000)
        balance_text = page.locator('h3.text-4xl').inner_text()
        balance = float(balance_text)
        assert balance >= 0
        page.screenshot(path="jules-scratch/verification/verification.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
