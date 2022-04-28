import React, { useState } from 'react';
import { db } from '../firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { useCookies } from 'react-cookie';
import {HeaderBar} from '../components.js';
import {Box, Typography, Button, TextField} from '@mui/material';
import {MenuItem, Select} from '@mui/material';

function NewProfile() {
  const [ cookies, setCookie ] = useCookies(['patient_id']);

  const [name, setName] = useState("");
  const [dob, setDob] = useState();
  const [gender, setGender] = useState("Male");
  const [disorder, setDisorder] = useState('NA');

  let now = new Date();
  const year = now.getFullYear();
  var month = now.getMonth() + 1;
  month = month >= 10 ? month : '0' + month;
  var dateVal = now.getDate();
  dateVal = dateVal >= 10 ? dateVal : '0' + dateVal;
  const date = year + '-' + month + '-' + dateVal;

  return (
    <>
      <HeaderBar title="Create New Profile" />
      <Box sx={{
        height: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const newProfileRef = await addDoc(collection(db, cookies.uid), {
            name: name,
            dob: dob,
            gender: gender,
            disorder: disorder
          });

          const cookie_set = [
            {id: 'pid', content: newProfileRef.id},
            {id:'name', content: name},
            {id:'dob', content: dob}
          ];
          cookie_set.forEach(function (item) {
            setCookie(item.id, item.content, {
              path: '/',
              sameSite: 'none',
              secure: true
            });
          });

          window.location = "./manage-profiles";
        }}>
          <Typography>Name</Typography>
          <TextField
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br /><br />

          <Typography>Date of Birth</Typography>
          <TextField
            type="date" required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
            min="1950-01-01" max= {date}
          />
          <br /><br />

          <Typography>Gender</Typography>
          <Select className="select"
            value={gender}
            onChange={e => setGender(e.target.value)}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
          <br /><br />

          <Typography>Disorder</Typography>
          <Select className="select"
            value={disorder}
            onChange={e => setDisorder(e.target.value)}
          >
            <MenuItem value="NA">None/Rather not say</MenuItem>
            <MenuItem value="ASD">Autism</MenuItem>
            <MenuItem value="ADHD">ADHD</MenuItem>
          </Select>
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

export default NewProfile;
