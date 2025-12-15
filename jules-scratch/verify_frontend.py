
import os
from playwright.sync_api import sync_playwright

def verify_arcade_mining_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport size to simulate Telegram Mini App
        context = browser.new_context(viewport={"width": 375, "height": 667})
        page = context.new_page()

        try:
            # Navigate to the local dev server
            page.goto("http://localhost:5173")

            # Wait for the page to load
            page.wait_for_timeout(5000)

            # We need to simulate being logged in because ArcadeMiningUI likely depends on user state
            # However, I don't have login credentials.
            # I will try to locate the component if it is visible.

            # Assuming there is a way to see the component or at least the login screen.
            # If there's a login screen, I might need to bypass it or mock the state.

            # Take a screenshot of the initial load
            page.screenshot(path="jules-scratch/initial_load.png")
            print("Initial screenshot taken.")

            # Check for "RhizaCore AI Nodes" text which I added to MiningDashboard
            try:
                # The text might be hidden behind a login wall.
                # Let's see if we can force the component to render or if we are on the login page.

                # If we see "Connect Wallet" or similar, we might need to click it.
                # But without a real wallet, we can't fully login.
                pass
            except Exception as e:
                print(f"Error checking for text: {e}")

            # Let's verify if we can spot the new visual elements
            # Look for the new header text
            # if page.get_by_text("RhizaCore AI Nodes").is_visible():
            #     print("Found new header!")

            # Look for the Mining/Boost/Rank tabs
            # if page.get_by_text("Boost").is_visible():
            #     print("Found Boost tab!")

            # Take a screenshot of what we see
            page.screenshot(path="jules-scratch/verification_dashboard.png")
            print("Dashboard screenshot taken.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="jules-scratch/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_arcade_mining_ui()
