 import React from 'react';

 class MapSelector extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      user: null
    };
   }

  DawnMountain() {
    document.getElementById('MapSelector').style.display = 'none'
    document.getElementById('DawnMountainCreateBackground').style.display = 'block'

  }

   render() {
     return (
        <div id="Levels">
          <div> 
            <div>
              <h3 id='ChooseLevelTitle'>Choose Level Below</h3>
              <div>
                <img id='DawnMountain' src='../../../textures/dawnmountain-xpos.png' />
                <div>
                  <button onClick={this.DawnMountain} className='btn btn-primary'>Dawn Mountain</button>
                </div>
              </div>
            </div>
          </div> 
        </div>
     );
    
   }
 }



 export default MapSelector;











