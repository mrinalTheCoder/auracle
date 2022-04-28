import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {useCookies} from 'react-cookie';
import {noAccountPages} from './games/constants.js';

import Login from "./acc-functions/Login";
import Register from "./acc-functions/Register";
import Reset from "./acc-functions/Reset";
import ManageProfiles from './acc-functions/ManageProfiles.js';
import NewProfile from './acc-functions/NewProfile.js';
import Feedback from './acc-functions/Feedback.js';

import Dashboard from "./Dashboard";
import Instructions from './instructions.js';
import ShapeMatching from "./games/shape-matching.js";
import ColorMatching from "./games/color-matching.js";
import ColorPicking from "./games/color-picking.js";
import ShapePicking from "./games/shape-picking.js";
import ShadowPicking from "./games/shadow-picking.js";

import Chart from './chart.js';

import theme from './theme.js';
import {ThemeProvider} from "@mui/material/styles";

function App() {
  const cookies = useCookies(['uid'])[0];
  if (cookies.uid === undefined && !(noAccountPages.includes(window.location.pathname))) {
    window.location = '/';
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/reset" element={<Reset />} />
          <Route exact path={"/manage-profiles"} element={<ManageProfiles />} />
          <Route exact path={"/new-profile"} element={<NewProfile />} />
          <Route exact path={"/feedback"} element={<Feedback />} />

          <Route exact path="/dashboard" element={<Dashboard />} />

          <Route exact path={"/instructions"} element={<Instructions />} />
          <Route exact  path={"/color-picking"} element={<ColorPicking />} />
          <Route exact path={"/shape-picking"} element={<ShapePicking />} />
          <Route exact path={"/color-matching"} element={<ColorMatching />} />
          <Route exact path={"/shape-matching"} element={<ShapeMatching />} />
          <Route exact path={"/shadow-picking"} element={<ShadowPicking />} />

          <Route path="/chart" element={<Chart />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
