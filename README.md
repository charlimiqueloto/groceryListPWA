# Modern Grocery List PWA

A vanilla JavaScript, HTML, and CSS grocery list app designed to run offline as a PWA.

## Features

- Add grocery items such as rice, beans, and fish.
- Add optional quantity for each item.
- Quantity cannot be less than zero.
- Add price using a CAD currency mask.
- Total is calculated from quantity × price.
- If quantity is empty, the app treats it as 1 for the total.
- Data is saved locally with `localStorage`.
- Offline support with a service worker.

## How to host on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/root` folder.
6. Save and open the GitHub Pages URL.

## Local testing

Because service workers require a web server, run the project with a local server instead of opening `index.html` directly.

Example with Python:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```


## Version 4
- Added a purchased checkbox for each grocery item.
- Purchased items are saved offline and shown with a crossed-out style.


## Version 5 update

- Price field now starts empty instead of showing CAD 0.00.
- CAD currency formatting is applied automatically as the user types.
- Example: typing 300 becomes CAD 3.00.
