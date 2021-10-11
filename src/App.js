import './App.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";

import ShapeMatching from "./shape-matching.js";
import ColorMatching from "./color-matching.js";

function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route path={"/shape-matching"} component={ShapeMatching} />
          <Route path={"/color-matching"} component={ColorMatching} />
        </Switch>
      </BrowserRouter>
      <a href='/shape-matching'>Shape Matching</a> <br/>
      <a href='/color-matching'>Color Matching</a>
    </>
  );
}

export default App;
