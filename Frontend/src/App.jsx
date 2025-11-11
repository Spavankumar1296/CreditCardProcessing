import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { Signup } from './components/Signup';
import { Signin } from './components/Signin';
import { RecoilRoot } from 'recoil';
import { Transfer } from './components/Transfer';
import Home from './components/Home';
import Account from './components/Account';
import ViewTransactions from './components/ViewTransactions';

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/Transfer" element={<Transfer />} />
          <Route path="/Account" element={<Account />} />
          <Route path="/viewTransactions" element={<ViewTransactions />} />


        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
