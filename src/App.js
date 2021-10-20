import './App.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";

import ShapeMatching from "./shape-matching.js";
import ColorMatching from "./color-matching.js";
import ColorPicking from "./color-picking.js";
import ShapePicking from "./shape-picking.js";

function App() {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route path={"/color-picking"} component={ColorPicking} />
          <Route path={"/shape-picking"} component={ShapePicking} />
          <Route path={"/color-matching"} component={ColorMatching} />
          <Route path={"/shape-matching"} component={ShapeMatching} />
        </Switch>
      </BrowserRouter>
      <a href='/color-picking'>Color Picking</a>
      <a href='/shape-picking'>Shape Picking</a> <br />
      <a href='/color-matching'>Color Matching</a> <br />
      <a href='/shape-matching'>Shape Matching</a> <br/>
    </>
  );
}

export default App;
