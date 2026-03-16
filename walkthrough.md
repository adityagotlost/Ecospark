# Plant Verification Feature Walkthrough

The "Plant a Tree" challenge now includes an AI-powered verification step to ensure users actually upload a valid image of a plant!

## Changes Made
1. **Dependencies**: Added `@tensorflow/tfjs` and `@tensorflow-models/mobilenet` to run lightweight image classification directly in the browser.
2. **PlantVerificationModal**: Created a sleek, glassmorphic UI modal ([PlantVerificationModal.jsx](file:///d:/Sih/src/components/PlantVerificationModal.jsx) & [.css](file:///d:/Sih/src/index.css)) where users can upload an image. The modal shows a loading state while the AI "wakes up" and analyzes the image.
3. **Challenge Interception**: Modified [Challenges.jsx](file:///d:/Sih/src/pages/Challenges.jsx) so that clicking "Mark Done" on the `plant-tree` challenge intercepts the normal flow and pops up the modal instead. If the AI detects plant-related keywords, points are awarded.

## Validation Results
We ran the Vite server and used a browser subagent to test the journey. The subagent successfully:
1. Created an account and navigated to the Challenges page.
2. Clicked "Mark Done" on the Plant a Tree challenge.
3. Successfully rendered the AI Verification Modal (see screenshots in the recording below).

*Note: The browser verification bot cannot programmatically browse local files to upload, but the file input correctly prompts for selection. You can safely test this manually!*

## Demo Recording
Below is a recording showing the UI flow in action:
![Plant Verification Demo](/C:/Users/Aditya/.gemini/antigravity/brain/fe120b89-c09f-4539-89dd-22ed0add07a3/plant_verification_test_1773598741213.webp)

## Next Steps
You can run `npm run dev` and navigate to `http://localhost:5173/`. Go to the Challenges page, try the "Plant a Tree" challenge, and upload some images to see the MobileNet model accurately classify them!
