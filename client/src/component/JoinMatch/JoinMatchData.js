import React from 'react';
import { browserHistory } from 'react-router';
import userProfile from '../userProfile.js';
import Game from '../Game/Game.js';
const clientScene = require('../../clientScene.js');
const sceneUtility = require('../../sceneUtility.js');
const socketUtility = require('../../socketUtility');


class JoinMatchData extends React.Component {
  constructor(props) {
    super(props);

    this.JoinMatch = this.JoinMatch.bind(this)
    this.props.match.numPlayers = Object.keys(this.props.match.clients).length;
  }

  JoinMatch(matchUrl) {
      userProfile.createMatch = false;
      userProfile.matchUrl = matchUrl;
      browserHistory.push('/Game');
  }

  render() {
    return (
    <div className='JoinMatchBox'>
      <div className='JoinMatchSpan'>
        <img alt={userProfile.maps[this.props.match.mapChoice].name} src={userProfile.maps[this.props.match.mapChoice].thumb} />
      </div>
      <div className='JoinMatchSpan'>{this.props.match.owner}</div>
      <div className='JoinMatchSpan'>{Object.keys(this.props.match.clients).length} / {+this.props.match.maxPlayers || 'Sandbox'}</div>
      <div className='JoinMatchSpan'>
        <button onClick={() => this.JoinMatch(this.props.match.url)} className={Object.keys(this.props.match.clients).length === this.props.match.maxPlayers || Object.keys(this.props.match.clients).length === 6 ? 'btn btn-danger' : 'btn btn-success'}>{Object.keys(this.props.match.clients).length === this.props.match.maxPlayers || Object.keys(this.props.match.clients).length === 6 ? 'Game Full' : 'Join Game'}</button>
      </div>
    </div>
    )
  }
}

export default JoinMatchData