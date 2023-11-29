import './App.css';
import {useState, useEffect} from 'react';
import Axios from 'axios';

function App() {
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [passwordList, setPasswordList] = useState([]);
  const [username, setUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  useEffect(() => {
    Axios.get('http://localhost:3001/getpasswords').then((response) => {
      setPasswordList(response.data)
    });
  }, []);

  const addPassword = () => {
    Axios.post('http://localhost:3001/addpassword', {
      password: password, 
      title: title
    });
  };

  const decryptPassword = (encryption) => {
    Axios.post('http://localhost:3001/decryptpassword', {
      password: encryption.password,
      iv: encryption.iv,
    }).then((response) => {
      setPasswordList(passwordList.map((val) => {
        return val.id == encryption.id ? {
          id: val.id,
          password: val.password,
          title: response.data,
          iv: val.iv
        }
        : val;
      }))
    })
  };

  const login = () => {
    Axios.post('http://localhost:3001/login', {
      username: username, 
      password: loginPassword
    }).then((response) => {
      if (response.data.loggedIn) {
        setLoggedIn(true);
      }
    });
  };

  const register = () => {
    Axios.post('http://localhost:3001/register', {
      username: registerUsername, 
      password: registerPassword
    }).then((response) => {
      if (response.data === "Success") {
        alert("User registered successfully");
      }
    });
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <div>
          <div>
            <h2>Register</h2>
            <input type="text" placeholder="Username" onChange={(e) => setRegisterUsername(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setRegisterPassword(e.target.value)} />
            <button onClick={register}>Register</button>
          </div>
          <div>
            <h2>Login</h2>
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setLoginPassword(e.target.value)} />
            <button onClick={login}>Login</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="AddingPassword">
            <input 
                type="text" 
                placeholder="Ex. MySpace"
                onChange={(event) => {
                  setTitle(event.target.value);
                  }}
              />
              <input 
                type="text" 
                placeholder="Ex. password123"
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
              <button onClick={addPassword}>Add Password</button>
            </div>

            <div className="displayPasswords">
              {passwordList.map((val, key) => {
                return (
                  <div
                   className="password" 
                   onClick = {() => {
                    decryptPassword({
                      password: val.password, 
                      iv: val.iv,
                      id: val.id,
                    })
                    key={key}
                   }}>
                    <h3>{val.title}</h3>
                  </div>
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;

