import React from 'react';
import Home from '../Home/Home.js'
import FacebookLogin from 'react-facebook-login'
import { browserHistory } from 'react-router';
import userProfile from '../userProfile.js'

class LogIn extends React.Component {
  constructor(props) {
	  super(props);
	  this.state = {
	    user: null
	  };
    this.responseFacebook = this.responseFacebook.bind(this)
  }

  playAsGuest() {
    browserHistory.push('/Home')
  }

  responseFacebook(e) {
    this.setState({ user: true })
    if(e.name) {
      userProfile.User = e.name;
      userProfile.FacebookPicture = e.picture.data.url;
      userProfile.Skins = [];
      userProfile.ChosenSkin = null;
      debugger;
      $.ajax({
        url: '/api/getUserByFacebookID/' + e.id,
        method: 'Get',
        success: (data) => {
          if(data.length == 0) {
            var username = prompt('Welcome to Smash Ball Brawl. Please Enter a Username');
            username = username || 'Random stringify'
            username = username.slice(0, 10);
            if(username !== null) {
              userProfile.User = username;
              userProfile.facebookid = e.id;
              var dataSent = {
                  username: username,
                  token: e.accessToken,
                  email: 'fakeEmail@gmail.com',
                  facebookid: e.id
                }
              $.ajax({
                url: '/api/addUser',
                method: 'Post',
                data: JSON.stringify(dataSent),
                contentType: 'application/json',
                error: (error) => {
                  console.log(error)
                },
                success: (data) => {
                  userProfile.stars = 200;
                  browserHistory.push('Home')
                }
              })
            }
          } else {
            userProfile.User = data.username;
            userProfile.Skins = data.skins || [];
            userProfile.facebookid = e.id;
            userProfile.userId = data.id;
            browserHistory.push('Home')
          }
        }
      })
    }
  }

  render() {
      return (
        <div className='logInContainer'>
          <img src='../../../textures/logotext.png' id='NonSelect'/>
          <div id='LogIn'>
            <div id='Facebook'>
              <FacebookLogin
                  appId="1709766049351226"
                  autoLoad={true}
                  fields="name,email,picture"
                  onClick={this.componentClicked}
                  callback={this.responseFacebook}
              />
              <div id='Guest'>
                <button onClick={this.playAsGuest} id='GuestLogIn' className='btn btn-warning'>Play As Guest</button>
              </div>
            </div>
          </div>
          <div className='version'>v0.7</div>
          <div className='createdBy'>Created by Nick Lathen, Will Stockman, Eric Eakin, and Riyaz Ahmed, 2016</div>
        </div>
      );

  }
}
export default LogIn;
