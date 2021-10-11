import './App.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";

import ShapeMatching from "./shape-matching.js";

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={"/shape-matching"} component={ShapeMatching} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
