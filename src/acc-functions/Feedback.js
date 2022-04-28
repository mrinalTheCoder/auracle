import {useCookies} from 'react-cookie';
import {useState} from 'react';
import { db } from '../firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import {HeaderBar} from '../components.js';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function Feedback() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const cookies = useCookies(['uid', 'pid'])[0];

  let now = new Date();
  const year = now.getFullYear();
  var month = now.getMonth() + 1;
  month = month >= 10 ? month : '0' + month;
  var dateVal = now.getDate();
  dateVal = dateVal >= 10 ? dateVal : '0' + dateVal;
  const date = year + '-' + month + '-' + dateVal;

  let collectionPath = "";
  if (cookies.uid === undefined) {
    collectionPath = "unsignedFeedback";
  } else {
    if (cookies.pid === undefined) {
      collectionPath = `${cookies.uid}/unknownPid/feedback`;
    } else {
      collectionPath = `${cookies.uid}/${cookies.pid}/feedback`;
    }
  }

  return (
    <>
      <HeaderBar title='Submit Feedback' />
      <br /><br />
      <Button style={{marginLeft: 100}} variant="contained" onClick={() => {
        window.location = document.referrer === '' ? '/dashboard' : document.referrer;
      }}>
        Back
      </Button>
      <Box sx={{
        height: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <form onSubmit={async (event) => {
          event.preventDefault();
          await addDoc(collection(db, collectionPath), {
            name: name,
            email: email,
            date: date,
            feedback: feedback
          });
          window.location = '/dashboard';
        }}>
          <Typography>Child Name</Typography>
          <TextField
            required
            value={name}
            onChange={(e) => {setName(e.target.value);}}
          />
          <br /><br />

          <Typography>Contact Email</Typography>
          <TextField
            required
            value={email}
            onChange={(e) => {setEmail(e.target.value);}}
          />
          <br /><br />

          <Typography>Enter Feedback</Typography>
          <TextField
            required
            multiline
            value={feedback}
            onChange={(e) => {setFeedback(e.target.value);}}
          />
          <br /><br />

          <Button variant="contained" component="label">
            Submit
            <input hidden type="submit" value={"Submit"}/>
          </Button>
        </form>
      </Box>
    </>
  );
}

export default Feedback;
