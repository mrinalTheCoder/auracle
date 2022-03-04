import React, { useState } from 'react';
import { db } from '../firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { useCookies } from 'react-cookie';
import {HeaderBar} from '../components.js';

function NewProfile() {
  const [ cookies, setCookie ] = useCookies(['patient_id']);

  const [name, setName] = useState("");
  const [dob, setDob] = useState();
  const [gender, setGender] = useState("Male");
  const [image, setImage] = useState('');

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
      <div className="patient-container">
        <form onSubmit={async (event) => {
          event.preventDefault();
          const newProfileRef = await addDoc(collection(db, cookies.uid), {
            name: name,
            dob: dob,
            gender: gender,
            dpBase: image
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

          window.localStorage.setItem('dpBase', image);
          window.location = "./manage-profiles";
        }}>
          <p>Name</p>
          <br/>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
          <br/>

          <p>Date of Birth</p>
          <br/>
          <input
            type="date" required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
            min="1950-01-01" max= {date}
          />
          <br/>

          <p>Gender</p>
          <br/>
          <select className="select"
            value={gender}
            onChange={e => setGender(e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <br/>

          <p>Profile Picture</p>
          <input
            type="file"
            accept='image/*'
            onChange={(event) => {
              let reader = new FileReader();
              reader.onload = async (e) => {
                setImage(e.target.result);
              };
              reader.readAsDataURL(event.target.files[0]);
            }}
            className="file-input"
          />
          <br />
          <input type="submit" value={"Submit"}/>
        </form>
      </div>
    </>
  );
}

export default NewProfile;
