import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Reset from "./Reset";
import Dashboard from "./Dashboard";

import Instructions from './instructions.js';
import ShapeMatching from "./shape-matching.js";
import ColorMatching from "./color-matching.js";
import ColorPicking from "./color-picking.js";
import ShapePicking from "./shape-picking.js";

function App() {
  return (
    <>
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
        </Routes>
      </Router>
      <a href='/instructions'>Instructions</a> <br />
      <a href='/color-picking'>Color Picking</a> <br />
      <a href='/shape-picking'>Shape Picking</a> <br />
      <a href='/color-matching'>Color Matching</a> <br />
      <a href='/shape-matching'>Shape Matching</a>
    </>
  );
}

export default App;
