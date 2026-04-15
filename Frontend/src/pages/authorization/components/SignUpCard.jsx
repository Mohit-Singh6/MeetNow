import * as React from 'react';
import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import logo from '../../../assets/logo.png';
import { GoogleIcon, FacebookIcon } from './CustomIcons.jsx';
import { Link, useNavigate } from "react-router-dom";
import './auth.css';
import server from '../../../environment.js';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignInCard() {

    let [formState, setFormState] = React.useState({
      name: "",
      username: "",
      email: "",
      password: ""
    });

    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [nameError, setNameError] = React.useState(false);
    const [nameErrorMessage, setNameErrorMessage] = React.useState('');
    const [usernameError, setUsernameError] = React.useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
    const [signUpError, setSignUpError] = React.useState(false);
    const [signUpErrorMessage, setSignUpErrorMessage] = React.useState('');

    const navigate = useNavigate();

  // const handleClickOpen = () => {
  //   setOpen(true);
  // };

  // const handleClose = () => {
  //   setOpen(false);
  // };

  const handleChange = (e) => {
    setFormState((prev) => {
      return {...prev, [e.target.name]: e.target.value};
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateInputs();
    if (!isValid) return;

    try {
      const response = await fetch(`${server.prod}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // VERY IMPORTANT (sessions)
        body: JSON.stringify({
          name: formState.name,
          username: formState.username,
          email: formState.email,
          password: formState.password,
        }),
      });

      console.log(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      // signup successful
      navigate("/login"); // or "/" if auto-login
    } 
    catch (err) {
        console.error(err.message);
        setSignUpError(true);
        setSignUpErrorMessage(err.message);
        // later you can show this error in UI
    }
  };


  const validateInputs = () => { 
    let isValid = true;

    if (!formState.email || !/\S+@\S+\.\S+/.test(formState.email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!formState.password || formState.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!formState.name || formState.name.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!formState.username || formState.username.length < 1) {
      setUsernameError(true);
      setUsernameErrorMessage('Username is required.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    return isValid;
  };

  return (
    <Card variant="outlined">
      <div className='brandContainer'>
        <img className="meetNowLogoAuth" src={logo} alt="MeetNow logo"/>
        <h5 className='meetNowText'>
          <span>Meet</span>Now
        </h5>
      </div>
      <h5 className='signInText'>
        Sign up
      </h5>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        <FormControl>
              <FormLabel htmlFor="name">Full name</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                value={formState.name}
                onChange={handleChange}
                id="name"
                placeholder="Type your full name here"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
              <TextField
                required
                fullWidth
                id="username"
                value={formState.username}
                onChange={handleChange}
                placeholder="How should others find you?"
                name="username"
                variant="outlined"
                error={usernameError}
                helperText={usernameErrorMessage}
                color={usernameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                value={formState.email}
                onChange={handleChange}
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                value={formState.password}
                onChange={handleChange}
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            
            {/* Showing the error that occured on clicking signUp, and it is different from normal requirements (like password atleast 6 characters, or invalid email type - except these) */}
            <div> 
                {signUpError && (
                    <div className="error-box" style={{ color: 'red'}}>
                        <p>{signUpErrorMessage}</p>
                    </div>
                )}
            </div>

            <button type="submit" class='navBtns loginBtn'>
              Sign up
            </button>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link to='/login'>
                Sign in
              </Link>
            </Typography>
      </Box>

    {/* Sign in using google or facebook has not been implemented yet */}

      {/* <Divider>or</Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Google')}
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Facebook')}
          startIcon={<FacebookIcon />}
        >
          Sign in with Facebook
        </Button>
      </Box> */}
    </Card>
  );
}
