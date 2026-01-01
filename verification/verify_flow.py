from playwright.sync_api import sync_playwright

def verify_intro_and_lobby():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Navigate to the app (using port 3000 as per server log)
            page.goto("http://localhost:3000")

            # Wait for Intro Screen to load
            # Note: IntroScreen text might vary, looking for button or title
            page.wait_for_selector("text=Husky's Snow", timeout=10000)

            # Take screenshot of Intro
            page.screenshot(path="verification/intro_screen.png")
            print("Captured intro_screen.png")

            # Click Enter (looking for button text or role)
            # Assuming IntroScreen has a button to enter lobby
            # If not present, we will inspect the failure.
            try:
                page.click("button:has-text('Enter')", timeout=3000)
            except:
                print("Could not find 'Enter' button, trying to find any button...")
                page.click("button")

            # Wait for Lobby Screen (Create Game / Join Game)
            page.wait_for_selector("text=Create New Game", timeout=5000)

            # Take screenshot of Lobby
            page.screenshot(path="verification/lobby_screen.png")
            print("Captured lobby_screen.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_intro_and_lobby()
