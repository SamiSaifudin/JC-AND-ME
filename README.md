# JC&ME

JC&ME is an application that accepts syllabus text and populates the user's Google Calendar with the extracted dates.

## Technologies Used

- ReactJS
- OpenAI
- Google Calendar API

## Features

- Extracts dates from the text of a syllabus.
- Populates Google Calendar with the extracted dates.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/JC-ME.git
    cd JC-ME
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root of the project and add your API keys:
    ```
    REACT_APP_GPT=your_openai_api_key
    ```
4. Set up Supabase and Google Calendar api 
    - A Supabase account. Sign up at [Supabase](https://supabase.com/).
    - A Google Cloud account with access to the Google Calendar API. Set it up at [Google Cloud Console](https://console.cloud.google.com/).


## Usage

1. Start the development server:
    ```bash
    npm start
    ```

2. Open your browser and navigate to `http://localhost:3000`.

3. Upload the text of a syllabus. 

4. Review the extracted dates and approve to add them to your Google Calendar.

## Acknowledgements

- Thanks to OpenAI for their amazing language model.
- Thanks to Google for their powerful Calendar API.




