import './App.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";

import ShapeMatching from "./shape-matching.js";
import ColorMatching from "./color-matching.js";
import ColorPicking from "./color-picking.js";

function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route path={"/shape-matching"} component={ShapeMatching} />
          <Route path={"/color-matching"} component={ColorMatching} />
          <Route path={"/color-picking"} component={ColorPicking} />
        </Switch>
      </BrowserRouter>
      <a href='/shape-matching'>Shape Matching</a> <br/>
      <a href='/color-matching'>Color Matching</a> <br />
      <a href='/color-picking'>Color Picking</a>
    </>
  );
}

export default App;
