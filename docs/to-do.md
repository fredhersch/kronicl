# Project To-Do List

Based on the project blueprint, here is a list of tasks to complete:

- [x] Memory Creation: Allow users to select photos and videos from their device to create a memory. User can select up to 3 images or 1 video
- [x] Audio Note Enrichment: Enable users to add audio notes (up to 300 seconds) to their memories, review a transcription and edit the transcribed text.
- [x] AI-Powered Enrichment: Automatically generate a title and short summary for each memory based on the transcribed text. Analyze the text for sentiment and generate relevant tags. Allow users to edit generated content using AI tool.
- [x] Metadata Management: Enable users to manage and edit the 'memory_date' and 'location' associated with each memory. The date will default to the file's last modified time. The location should be based on the users current location by default and show the name of the place (e.g. Singapore) with a location pin on a map. The user can search for places and this will update the pin on the map
- [x] Upload Progress: When uploading the media, show a progress bar and estimate of upload time
- [ ] Error Handling: Catch all errors and provide clear error messages back to the user
- [x] Memory Display: Display memories in a list or gallery view, with key information and a link to play the audio. Open a detailed read-only view upon tapping.
- [x] Memory Search: Implement a search bar to filter memories based on title, summary, transcription text, or tags.
- [x] User Authentication: Require users to sign in with their Google account to access the app, ensuring memories are private and secure.
- [ ] Cloud App Linking: Able to link to Google Photos to select specific images or video from there. Should store reference to the files and not the raw media themselves
