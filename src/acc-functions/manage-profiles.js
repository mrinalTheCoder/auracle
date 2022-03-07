import React from 'react';
import {db} from '../firebase.js';
import { Cookies, withCookies } from "react-cookie";
import {ProfileCard, HeaderBar} from "../components.js";
import IconButton from '@mui/material/IconButton';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import { instanceOf } from 'prop-types';
import { getDocs, collection } from "firebase/firestore";

class ManageProfiles extends React.Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super(props);
    const cookies = props.cookies.cookies;
    this.state = {patients:[], uid: cookies.uid};
  }

  async componentDidMount() {
    const querySnapshot = await getDocs(collection(db, this.state.uid));
    let temp = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dpBase = (data.dpBase != null || data.dpBase !== "") ? data.dpBase : "";
      temp.push([doc.id, data, dpBase]);
    });
    await this.setState({patients:temp});
  }

  render() {
    return (
      <div>
        <HeaderBar title="Manage Profiles" />
        <ul>
          {this.state.patients.map((patient, idx) => (
            <ProfileCard key={idx} id={patient[0]} data={patient[1]} imgSrc={patient[2]} showDelete/>
          ))}
        </ul>
        <IconButton sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          color:'primary.main'
        }} onClick={()=>{window.location="/new-profile"}}>
          <AddCircleOutlinedIcon sx={{fontSize: 100}}/>
        </IconButton>
      </div>
    );
  }
}

export default withCookies(ManageProfiles);
