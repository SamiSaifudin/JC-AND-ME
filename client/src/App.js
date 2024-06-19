import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import React, { useRef } from 'react';
import { useState } from 'react';
import OpenAI from 'openai';

 
const openAIClient = new OpenAI({
  apiKey: process.env.REACT_APP_GPT
})

function App() {
  const session = useSession();
  const supabase = useSupabaseClient(); 
  const { isLoading } = useSessionContext();
  const [showPopUp, setShowPopUp] = useState(false);
  const [eventsString, setEventsString] = useState(""); 
  const [events, setEvents] = useState([]);
  const [syllabusText, setSyllabusText] = useState([]);

  if (isLoading){
    return <></>
  }

  /*
   * Function meant to handle when the user decides to send their text.  
  */
  const handleSubmit = (event) => {
    event.preventDefault();
    initializeSyllabusParsing();
  };

  /*
   * Function meant to initialize the parsing of the syllabus text. 
  */
  async function initializeSyllabusParsing(){
    let parsedDates = await parseDatesWithGPT(syllabusText);

    //Check if there was any errors are found from the GPT function 
    if (parsedDates == null){
      alert("GPT Error");
      return;
    }else if (parsedDates == "No dates available"){
      alert("No dates found within Syllabus"); 
      return; 
    }

    //Prepare the the events found to be displayed
    let displayString = "";


    for (let i = 0; i < parsedDates.length; i++){
      events.push(parsedDates[i]);
      displayString += ("(")
      displayString += (parsedDates[i].event_Name + ": ");

      if (parsedDates[i].event_Description != null){displayString += (parsedDates[i].event_Description + ", ");}

      displayString += (parsedDates[i].start_time + " to ");

      displayString += (parsedDates[i].end_time + ")|");
    }

    setEventsString(displayString); 
    setShowPopUp(true);
  }
  
  /*
   * Function meant to initialize the creation of calendar events.
   * Loop through all the events and call the createCalendarEvent function. 
  */
  async function initializeCalendarEvent() {
    let result = null; 
    for (let i = 0; i < events.length; i++){
      result = createCalendarEvent(events[i]);
      if (result == null){break;}
    }
    if (result != null){alert("Events Created!");}
    setShowPopUp(false);
  }

  /*
   * Function meant to create a calendar event using the google calendar api. 
  */
  async function createCalendarEvent(eventObj){
    let start = new Date(eventObj.start_time).toISOString();
    let eventName = eventObj.event_Name;
    let eventDescription = eventObj.event_Description;
    let end = new Date(eventObj.end_time).toISOString(); 

    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': end,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    }

    try{
      await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' +  session.provider_token
      },
      body: JSON.stringify(event)
      }).then((data) => {
        return data.json();
      })
    }catch (error){
      alert(`Failed to create event: ${error.message}`);
      return null; 
    }
    
  }

  /*
   * Function meant to request gpt to parse the syllabus content for any important dates and return the events in a JSON format. 
  */
  async function parseDatesWithGPT(fileContent){
    const prompt = `
    Extract exams and assignment due dates (only one-day events) from the syllabus: "${fileContent}".
    Provide the events in JSON format with fields:
    - event_Name
    - event_Description
    - start_time (Month Day, Year Hour:Minute:Second, default to January 1, 2024 09:00:00 if date/time not provided)
    - end_time (Month Day, Year Hour:Minute:Second, default to January 1, 2024 12:00:00 if date/time not provided).
    If any field is not available, return it as null.
    If no dates are available, return the array as empty. 
    Example format: [{ "event_Name": "Calc III Exam 1", "description": "Chapter 1-3", "start_time": "September 15, 2021 09:00:00", "end_time": "September 15, 2021 12:00:00" }, ...]
    Make course recognizable. Instead of "Test 1", say "History Test 1". 
    `
      
    try {
        const response = await openAIClient.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {role: "system", "content": "You are a helpful assistant that extracts and organizes due dates for assignments and exams from syllabi."},
              {role: "user", "content": prompt}]
        });
        
        let generatedText = response.choices[0].message.content.trim();

        // Remove the leading "```json"
        if (generatedText.startsWith("```json")) {generatedText = generatedText.substring(7);}

        // Remove the trailing "```"
        if (generatedText.endsWith("```")) {generatedText = generatedText.substring(0, generatedText.length - 3);}

        const generatedJSON = JSON.parse(generatedText.trim()); 
        return generatedJSON.length > 0 ? generatedJSON : "No dates available";
    } catch (error) {
        console.error('Error parsing dates with GPT:', error);
        return null;
    }
  };
  
  /*
   * Function meant to close the pop up that shows up displaying the events found. 
  */
  async function handleClosePopUp(){
    setShowPopUp(false);
  };

  /*
   * Function meant to handle the google sign in. 
  */
  async function googleSignIn(){
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options : {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    })
    if(error){
      alert("Error logging in to Google provider.")
    }
  }

  /*
   * Function meant to handle the google sign out. 
  */
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="App">
      <div className = "App-content"style={{width: "400px", margin: "30px auto"}}>
        {session ?
          <>
            <h2> Hey there {session.user.email}</h2>
          

            <textarea 
            name="syllabus_txt" 
            id="syllabusText" 
            cols="30" 
            rows="10" 
            placeholder="Your Syllabus Text" 
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}>
            </textarea>
            
            <form onSubmit={handleSubmit}><input type="submit" value="Send Message" class="send-btn"></input></form>
            
            <button onClick={() => signOut()}>Sign Out</button>

            {/* Conditionally render the pop-up */}
            {showPopUp && (
              <div className="popup">
                {/* Content of the pop-up */}
                <ul id="eventList"></ul>
                <p>{eventsString}</p>
                {/* Exit button */}
                <button onClick={initializeCalendarEvent}>Import Dates</button>
                <button onClick={handleClosePopUp}>Exit</button>
              </div>
            )}

          </>
          :
          <>
            <h1>JC&ME</h1>
            <button onClick={() => googleSignIn()}>Sign In With Google</button>
          </>
        }
      </div>
    </div>
  );
}

export default App;
