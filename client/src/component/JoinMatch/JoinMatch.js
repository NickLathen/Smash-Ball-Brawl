import React from 'react';
import { browserHistory } from 'react-router';
import JoinMatchData from './JoinMatchData.js';
import Profile from '../Home/Profile.js';
import userProfile from '../userProfile.js';

class JoinMatch extends React.Component {
  constructor(props) {
	  super(props);
	  this.state = {
	    user: null,
      liveMatches: [],
      refresh: false
	  };
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
            browserHistory.push('JoinMatch')
          },
          error: (error) => {
            console.log(error)
          }
        })
      }
    }
    const loadMatches = function loadMatches(component) {
      if (!component.state.refresh) {
        $.ajax({
          url: '/api/liveGames',
          method: 'GET',
          success: (data) => {
            const physicsServers = JSON.parse(data);
            const liveMatches = [];
            for (var url in physicsServers) {
              const server = physicsServers[url];
              if (server !== 'empty' && Object.keys(server.clients).length !== server.maxPlayers && Object.keys(server.clients).length < 6) {
                server.url = url;
                liveMatches.push(server)
              }
            }
            component.setState({liveMatches: liveMatches})
          }
        });
      }
    };
    loadMatches(this);
    this.pollInterval = setInterval(loadMatches.bind(null, this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.pollInterval);
  }

  backToHome() {
    browserHistory.push('/Home');
  }

  selectSkin() {
    browserHistory.push('/SelectSkin')
  }

  render() {
    return (
      <div className='menuContainer'>
        <div id='Profile'>
          <Profile />
        </div>
        <div className='menuBackground'>
          <div className='buttonBox'>
            <button className='btn btn-primary homeBtn' onClick={this.backToHome}>◀ Back</button>
            <h1>Join Match</h1>
            <button className='btn btn-warning selectSkinBtn' onClick={this.selectSkin}>Select Skin</button>
          </div>
          <div id='JoinMatchData'>
            <div id='JoinMatchTable'>
              <div className='JoinMatchHeader'>
                <div className='JoinMatchSpan'>Map</div>
                <div className='JoinMatchSpan'>Host</div>
                <div className='JoinMatchSpan'>Players</div>
                <div className='JoinMatchSpan'></div>
              </div>
              <div className='JoinMatchBody'>
                {this.state.liveMatches.map((match) => <JoinMatchData key={match.url} match={match} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  }
}

export default JoinMatch;