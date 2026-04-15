import * as React from 'react';
import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import logo from '../../../assets/logo.png';
import { GoogleIcon, FacebookIcon } from './CustomIcons.jsx';
import { Link, useNavigate } from "react-router-dom";
import './auth.css';

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

  let navigate = useNavigate();

  let [formState, setFormState] = React.useState({
    username: "",
    password: ""
  });

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [signInError, setSignInError] = React.useState(false);
  const [signInErrorMessage, setSignInErrorMessage] = React.useState('');
  // const [open, setOpen] = React.useState(false);

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

    if (!validateInputs()) return;

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Without the header, the server does not know this is JSON.
        // Why this header is NOT needed in forms
        // <form method="POST"> (browser sets it automatically)
        credentials: "include",

          // “Send cookies with this request, and accept cookies in the response.”

          // Why you NEED it in your app
          // Your backend uses:
            // express-session
            // passport.session()
          // Which means:
              // Login creates a session cookie
              // Cookie is how the user stays logged in
          // Without credentials: "include":
              // Browser does NOT send cookies
              // Browser does NOT store cookies
              // Every request looks like a new user
              // Login appears to “succeed” but user is never authenticated

        body: JSON.stringify({
          username: formState.username,
          password: formState.password,
        }),
      });

      if (!response.ok) {
        // `response` is **always resolved** unless there is a **network failure**.
        // It does **NOT** automatically throw errors for HTTP failures.
        // `response.ok` is a **boolean flag** provided by the browser.

        // response.ok === true

        // **ONLY when** HTTP status is in this range: 200 ≤ status ≤ 299
        // Everything else → `false`.

        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      navigate("/home");
    } catch (err) {
      setSignInError(true);
      setSignInErrorMessage('Username or password is wrong.');
    }
  };


  const validateInputs = () => {

    let isValid = true;

    if (!formState.username || formState.username.length < 1) {
      setUsernameError(true);
      setUsernameErrorMessage('Username is required.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!formState.password || formState.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <Card variant="outlined">
      <div class='brandContainer'>
        <img className="meetNowLogoAuth" src={logo} alt="MeetNow logo"/>
        <h5 class='meetNowText'>
          <span>Meet</span>Now
        </h5>
      </div>
      <h5 class='signInText'>
        Sign in
      </h5>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <TextField
            required
            fullWidth
            id="username"
            value={formState.username}
            onChange={handleChange}
            placeholder="Username"
            name="username"
            variant="outlined"
            error={usernameError}
            helperText={usernameErrorMessage}
            color={usernameError ? 'error' : 'primary'}
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
            variant="outlined"
            error={passwordError}
            helperText={passwordErrorMessage}
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>

        {/* Showing the error that occured on clicking Sign In, and it is different from normal requirements (like password atleast 6 characters - except these) */}
        <div> 
            {signInError && (
                <div className="error-box" style={{ color: 'red'}}>
                    <p>{signInErrorMessage}</p>
                </div>
            )}
        </div>


          {/* REMEMBER ME FUNCTION HAS NOT BEEN IMPLEMENTED YET */}
        {/* <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label={<Typography fontSize="0.875rem">Remember me</Typography>}
        /> */}
        <button type="submit" class='navBtns loginBtn'>
          Sign in
        </button>
        <Typography sx={{ textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <span>
            <Link to='/signup'>
              Sign up
            </Link>
          </span>
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
