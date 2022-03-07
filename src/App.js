import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Reset from "./Reset";
import ManageProfiles from './acc-functions/manage-profiles.js';
import NewProfile from './acc-functions/new-profile.js';

import Dashboard from "./Dashboard";
import Instructions from './instructions.js';
import ShapeMatching from "./shape-matching.js";
import ColorMatching from "./color-matching.js";
import ColorPicking from "./color-picking.js";
import ShapePicking from "./shape-picking.js";

import theme from './theme.js';
import {ThemeProvider} from "@mui/material/styles";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/reset" element={<Reset />} />
          <Route exact path="/dashboard" element={<Dashboard />} />

          <Route exact path={"/instructions"} element={<Instructions />} />
          <Route exact  path={"/color-picking"} element={<ColorPicking />} />
          <Route exact path={"/shape-picking"} element={<ShapePicking />} />
          <Route exact path={"/color-matching"} element={<ColorMatching />} />
          <Route exact path={"/shape-matching"} element={<ShapeMatching />} />

          <Route exact path={"/manage-profiles"} element={<ManageProfiles />} />
          <Route exact path={"/new-profile"} element={<NewProfile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
