import React from 'react';
import { browserHistory } from 'react-router';
import Profile from './Profile.js';
import userProfile from '../userProfile.js';
import _ from 'underscore';
const clientScene = require('../../clientScene.js');

class Home extends React.Component {
  constructor(props) {
	  super(props);
	  this.state = {
	    user: null,
      liveMatches: []
	  };
    this.showLeaderBoards = this.showLeaderBoards.bind(this);
    this.JoinMatch = this.JoinMatch.bind(this);
  }

  componentWillMount() {
    if(userProfile.User === 'Guest') {
      if(window.localStorage.id) {
        $.ajax({
          url: '/api/getUserByFacebookID/' + window.localStorage.id,
          method: 'Get',
          success: (data) => {
            userProfile.User = data.username;
            userProfile.Skins = data.skins || [];
            userProfile.facebookid = data.facebookid;
            userProfile.userId = data.id;
            userProfile.FacebookPicture = data.url;
            browserHistory.push('Home')
          },
          error: (error) => {
            console.log(error)
          }
        })
      } else {
        const randomGenerator = function () {
          const randomAdj = ['Bad', 'Whack', 'Manic', 'Freak', 'Bliss', 'Trash', 'Dope'];
          const randomNoun = ['Geek', 'Doll', 'Tron', 'Pie', 'Dog', 'Cat', 'Shark']
          let randomStr = '';
          randomStr += randomAdj[_.random(0,randomAdj.length-1)];
          randomStr += randomNoun[_.random(0,randomNoun.length-1)];
          randomStr += _.random(0, 10);
          return randomStr;
        };
        userProfile.User = randomGenerator();
        browserHistory.push('/Home')
      }   
    }
  }
  
  justPlay() {
    browserHistory.push('/Game')
  }

  CreateMatch() {
    browserHistory.push('/CreateMatch')
  }

  JoinMatch() {
    browserHistory.push('/JoinMatch')
  }

  About() {
    browserHistory.push('About')
  }

  showLeaderBoards() {
    //send request for leaderBoards
    browserHistory.push('/LeaderBoard')
  }

  render() {
    return (
      <div id='HomePage'>
        <div id='Profile'>
          <Profile />
        </div>
        <div id='HomeScene'>
          <img src='../../../textures/logotext.png' id='NonSelect'/>
          <div id="Play">
            <button id="PlayBtn" onClick={this.justPlay} className='btn btn-primary'>Play</button>
          </div>
          <div id="joinButtons">
            <button id="joinMatch" onClick={this.CreateMatch} className='btn btn-primary'>Create Match</button>
            <button id="joinExisting" onClick={this.JoinMatch} className='btn btn-primary'>Join Match</button>
          </div>
          <button id="LeaderBoardButton" onClick={this.showLeaderBoards} className='btn btn-primary'>View Leaderboards</button>
          <div>
            <button id="About" onClick={this.About} className='btn btn-primary'>About</button>
          </div>
        </div>
        <div className='version'>v0.7</div>
        <div className='createdBy'>Created by Nick Lathen, Will Stockman, Eric Eakin, and Riyaz Ahmed, 2016</div>
      </div>
    );

  }
}

export default Home;