<script lang=ts>

import * as router from 'svelte-spa-router'
import * as SocketManager from '../managers/SocketManager'
import SvgIcon from '../components/SvgIcon/SvgIcon.svelte'
import MechCanvas from '../components/MechCanvas.svelte'
import MechPicker from '../components/MechPicker.svelte'
import Header from '../components/Header.svelte'
import Mech from '../mechs/Mech'
import { items2ids, getItemsHash, matchItemsHash } from '../items/ItemsManager'
import { onDestroy, onMount } from 'svelte'
import { battle } from '../stores'
import { userData } from '../stores/userData'
import { Battle } from '../battle/Battle'
import { getRandomStartingPositions } from '../battle/utils'
import { addPopup } from '../managers/PopupManager'
import { checkSetup } from '../battle/utils'
import { currentMech, mechs } from '../stores/mechs'
import { MatchMakerState, matchMakerState } from '../stores/matchMakerState';



// Types

interface LobbyUser {
  name: string
  id: string
  isMatchMaking: boolean
  admin: boolean
}


interface ProfileData {
  name: string;
  mech: {
    name: string;
    setup: number[];
    hash: string;
  }
}


interface BattleUserJSON {
  id: string
  name: string
  mech: {
    name: string
    setup: number[]
  }
  position: number
  isAdmin: boolean
}


interface LobbyBattleStartData {
  starterID: string
  a: BattleUserJSON
  b: BattleUserJSON
}


enum ConnectionState {
  Connected,
  Connecting,
  Disconnected,
}



// State

let showMechPicker: boolean = false
let pickingOpponent: boolean = false
let showProfile: boolean = false
let currentProfileHash: string = ""
let awaitingResponse: boolean = false;

let connectionState = ConnectionState.Disconnected;
let users: LobbyUser[] = [];



// Functions

function showNoMechSelectedPopup (): void {
  addPopup({
    title: 'No mech selected!',
    message: 'Return to workshop to build one.',
    mode: 'error',
    options: {
      Ok () {
        router.replace('/workshop')
        this.remove()
      }
    }
  })
}


/** Returns the mechs that can fight, includes invalid mechs. */
function getFightableMechs (mechs: Mech[]): Mech[] {
  return mechs.filter(mech => {
    return mech.slots.torso && mech.slots.legs
  })
}



// events

async function onOnlineBattle (): Promise<void> {

  if ($matchMakerState === MatchMakerState.Awaiting) {
    return;
  }

  switch (connectionState) {

    case ConnectionState.Connected:

      // No battling with an outdated client ok
      if (SocketManager.isClientOutdated()) {
        SocketManager.addOutdatedClientPopup();
        return;
      }

      // We are using a mech, right?
      if (!$currentMech) {
        showNoMechSelectedPopup();
        return;
      }

      // Is our mech valid though?
      try {
        checkSetup($currentMech.setup);
      } catch(err: any) {
        addPopup({
          title: `Can't use invalid mech in online battles!`,
          message: err.message,
          mode: 'error',
        });
        return;
      }

      // Resolve action
      if ($matchMakerState === MatchMakerState.In) {
        SocketManager.lobbyExitMatchMaker();
      } else {
        SocketManager.lobbyJoinMatchMaker();
      }
      $matchMakerState = MatchMakerState.Awaiting;

      break;


    case ConnectionState.Connecting:
      return;


    case ConnectionState.Disconnected: {

      let canceled = false;

      const tryingToConnectPopup = addPopup({
        title: 'Trying to connect to server',
        message: 'Please wait up to 10 seconds...',
        hideOnOffclick: false,
        spinner: true,
        options: {
          Cancel () {
            canceled = true;
            this.remove();
          },
        }
      });

      SocketManager.tryToConnectManually().catch(err => {

        if (canceled) {
          return;
        }

        const attempts = SocketManager.getConnectionErrorsStreak();

        const message: string[] = [
          `We tried to reconnect ${attempts} time${attempts > 1 ? '' : 's'}!`,
          '',
          `Error: "${err.message}"`,
        ];

        if (attempts > 4) {
          message.push('If the error persists reload the page or try again later.');
        }

        addPopup({
          mode: 'error',
          title: 'Failed to connect to server',
          message,
          options: {
            Ok () {
              this.remove();
            },
            Retry () {
              this.remove();
              onOnlineBattle();
            },
          }
        });

      }).finally(() => {

        tryingToConnectPopup.remove();
  
      });
    }

  }

}


function onOfflineBattle (): void {

  // if (!canOfflineBattle) {

  //   addPopup({
  //     title: 'Hold on!',
  //     message: "Can't play offline battles while searching for an online battle!",
  //     mode: 'error',
  //     options: {
  //       Ok () { this.remove() },
  //     }
  //   })

  //   return

  // }


  let issue = ''

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }
  
  if ($currentMech.setup[Mech.TORSO_INDEX] === null) {
    issue = 'a torso!'
  } else if ($currentMech.setup[Mech.LEGS_INDEX] === null) {
    issue = 'legs!'
  }

  if (issue) {

    addPopup({
      title: 'Hold on!',
      message: `You can't battle without ` + issue,
      mode: 'error',
      options: {
        Ok () {
          this.remove()
        }
      }
    })

  } else {

    showMechPicker = true
    pickingOpponent = true

  }

}


function onPickMech (mech: Mech[]): void {

  showMechPicker = false

  if (mech.length === 0) {
    return
  }

  if (!pickingOpponent) {
    $currentMech = mech[0]
    return
  }

  if ($currentMech === null) {
    showNoMechSelectedPopup()
    return
  }

  const [pos1, pos2] = getRandomStartingPositions()
  const playerID = 'player'

  $battle = new Battle({
    online: false,
    p1: {
      id: playerID,
      name: $userData.name,
      mech: $currentMech,
      position: pos1,
    },
    p2: {
      id: 'bot',
      name: 'Skynet',
      mech: mech[0],
      position: pos2,
      ai: !$userData.settings.controlOfflineOpponent
    },
    starterID: playerID,
    onUpdate: value => $battle = value,
    povPlayerID: playerID,
  })

  router.push('/battle')

}


function toggleProfile (): void {

  showProfile = !showProfile;
  pickingOpponent = false;

  if (!$userData.name) {
    $userData.name = 'Unnamed Pilot';
  }

  const data = getProfileData();
  const hash = JSON.stringify(data);

  // If is about to change profile, prepare the
  // current hash to check if it changed later
  if (showProfile) {
    currentProfileHash = hash;
    return;
  }
  
  // Done changing profile, time to actually
  // check if something changed before updating
  if (hash !== currentProfileHash) {
    awaitingResponse = true;
    SocketManager.getSocket().emit('profile.update', data);
  }

}


function getProfileData (): ProfileData {

  const data: ProfileData = {
    name: $userData.name,
    mech: {
      name: '',
      setup: [],
      hash: '',
    },
  }

  if ($currentMech) {
    data.mech.name = $currentMech.name;
    data.mech.setup = items2ids($currentMech.setup);
    data.mech.hash = getItemsHash(data.mech.setup);
  }

  return data

}


function getColorForPlayer(player: LobbyUser): string {

  if (player.admin) {
    return 'var(--color-error)'
  }

  if (player.id === SocketManager.getSocket().id) {
    return 'var(--color-success)'
  }

  return 'var(--color-text)'

}



// Socket shit

const socketAttachment = SocketManager.createAttachment({

  'lobby.joinSuccess'(data: { users: LobbyUser[] }): void {
    users = data.users;
  },

  'lobby.joinError'(error: { message: string }): void {
    users = [];
    addPopup({
      mode: 'error',
      title: 'Failed to join lobby!',
      message: error.message,
      hideOnOffclick: true,
    });
  },

  'lobby.userJoin'(data: { user: LobbyUser }): void {

    const index = users.findIndex(user => user.id === data.user.id);

    if (index > -1) {
      users[index] = data.user;
    } else {
      users.push(data.user);
      users = users; // Trigger update
    }

  },

  'lobby.userExit'(data: { id: string }): void {
    users = users.filter(user => user.id !== data.id);
  },


  'lobby.joinMatchMakerSuccess'(): void {
    $matchMakerState = MatchMakerState.In;
  },

  'lobby.joinMatchMakerError'(error: { message: string }): void {
    $matchMakerState = MatchMakerState.Out;
    addPopup({
      mode: 'error',
      title: 'Failed to join match maker!',
      message: error.message,
      hideOnOffclick: true,
    });
  },

  'lobby.exitMatchMakerSuccess'(): void {
    $matchMakerState = MatchMakerState.Out;
  },

  'lobby.exitMatchMakerError'(error: { message: string }): void {
    // Set to false anyway
    $matchMakerState = MatchMakerState.Out;
    console.error('Failed to exit match maker: ', error);
  },

  'lobby.userJoinMatchMaker'(data: { id: string }): void {
    const index = users.findIndex(user => user.id === data.id);
    if (index !== -1) {
      users[index].isMatchMaking = true;
    }
  },

  'lobby.userExitMatchMaker'(data: { id: string }): void {
    const index = users.findIndex(user => user.id === data.id);
    if (index !== -1) {
      users[index].isMatchMaking = false;
    }
  },


  'lobby.verifyOpponent'(data: { setup: number[], hash: string }): void {
    const valid = matchItemsHash(data.setup, data.hash);
    console.log({ data, valid });
    SocketManager.lobbyVerifyOpponent(valid);
  },


  'lobby.startBattle'(data: LobbyBattleStartData): void {
      
    $matchMakerState = MatchMakerState.Out;
  
    const mechA = new Mech({
      name: data.a.mech.name,
      setup: data.a.mech.setup
    })
  
    const mechB = new Mech({
      name: data.b.mech.name,
      setup: data.b.mech.setup
    })
  
    $battle = new Battle({
      online: true,
      starterID: data.starterID,
      p1: {
        id: data.a.id,
        name: data.a.name,
        position: data.a.position,
        mech: mechA,
        admin: data.a.isAdmin,
        ai: false,
      },
      p2: {
        id: data.b.id,
        name: data.b.name,
        position: data.b.position,
        mech: mechB,
        admin: data.b.isAdmin,
        ai: false,
      },
      onUpdate: value => battle.set(value),
      povPlayerID: SocketManager.getSocket().id,
    })
  
    router.push('/battle');
  
  },


  'profile.updateSuccess'(): void {
    awaitingResponse = false;
  },

  'profile.updateError'(error: { message: string }): void {
    awaitingResponse = false;
    addPopup({
      mode: 'error',
      title: 'Failed to update profile!',
      message: error.message,
      hideOnOffclick: true,
    });
  },


  // Connection

  'disconnect' (): void {
    users = [];
    connectionState = ConnectionState.Disconnected;
    $matchMakerState = MatchMakerState.Out;
  },

  'connect' (): void {
    SocketManager.lobbyJoin(getProfileData());
    connectionState = ConnectionState.Connected;
  }

})


onMount(() => {

  socketAttachment.attach();

  if (SocketManager.isConnected()) {
    SocketManager.lobbyJoin(getProfileData());
    connectionState = ConnectionState.Connected;
  } else {
    SocketManager.tryToConnectManually();
    connectionState = ConnectionState.Connecting;
  }

})

onDestroy(() => {

  socketAttachment.detach();

  if (SocketManager.isConnected()) {
    SocketManager.lobbyExit();
  }

})

</script>



<main>

  <Header title="Lobby" hideMatchMakingPopup />


  <div class="mech-gfx-container">
    {#if $currentMech}
      <MechCanvas setup={$currentMech.toJSONModel().setup} />
    {/if}
  </div>


  <div class="buttons">

    <button class="global-box" on:mousedown={onOfflineBattle}>
      Battle VS Computer
    </button>

    <button class="global-box" on:mousedown={onOnlineBattle}>

      {#if connectionState === ConnectionState.Connected}

        {#if $matchMakerState = MatchMakerState.In}
          <span>Searching for battle</span>
          <SvgIcon name="aim" class="spinner" style="margin-left: 0.5em"/>
        {:else}
          Online Battle
        {/if}
        
      {:else if connectionState === ConnectionState.Connecting}

        <span>Connecting</span>
        <SvgIcon name="aim" class="spinner" style="margin-left: 0.5em"/>

      {:else}

        Disconnected
      
      {/if}

    </button>
    
  </div>


  <div class="players-list global-box">

    <header>
      <span style="margin-left: 0.5em">{$userData.name}</span>
      <button class="profile-button global-box" on:click={toggleProfile}>
        <SvgIcon name="pencil" color="var(--color-text)" />
      </button>
    </header>

    {#if connectionState === ConnectionState.Connected}
    
      <div class="list-container">
        <ul>

          {#each users as user}

            <li style="color: {getColorForPlayer(user)}">

              <span>{user.name}</span>

              {#if user.isMatchMaking}
                <SvgIcon name="aim" class="spinner" />
              {/if}

            </li>
            
          {/each}
          
        </ul>
      </div>
    
    {:else}

      <div class="center">
        {#if connectionState === ConnectionState.Disconnected}

          <span style="opacity: 0.5">Disconnected</span>

        {:else}

          <span>Connecting</span>
          <SvgIcon
            name="aim"
            class="spinner"
            style="width: 1em; height: 1em; margin: 0.5em"
          />

        {/if}
      </div>

    {/if}

  </div>


  {#if showProfile}
    <div class="global-darkscreen" on:click={e => e.target === e.currentTarget && toggleProfile()}>
      <div class="profile global-box">
        <header>
          <span>Profile</span>
          <button class="global-box" on:click={toggleProfile}>
            <SvgIcon name="cross" />
          </button>
        </header>
        <div class="sections">
          <section>
            <span>Name</span>
            <input
              type="text"
              bind:value={$userData.name}
              maxlength="32"
              placeholder="Unnamed Pilot"
            >
          </section>
          <section>
            <span>Mech</span>
            <div class="mech-container">
              {#if $currentMech}
                <MechCanvas setup={$currentMech.toJSONModel().setup} />
              {/if}
            </div>
            <button on:click={() => showMechPicker = !showMechPicker}>Change Mech</button>
          </section>
        </div>
      </div>
    </div>
  {/if}


  {#if showMechPicker}
    <MechPicker
      title={pickingOpponent ? "Select opponent's mech" : "Select mech"}
      onPick={onPickMech}
      mechs={getFightableMechs($mechs)}
    />
  {/if}


  {#if awaitingResponse}
    <div class="global-darkscreen">
      <SvgIcon name="aim" class="spinner" style="height: 2em"/>
    </div>
  {/if}

</main>



<style>

main {
  display: grid;
  grid-template-rows: 3em 1fr 2.5em;
  grid-template-columns: 1fr 16em;
  grid-template-areas:
    'header header'
    'mech players'
    'buttons players';
  width: 100%;
  height: 100%;
  max-width: var(--content-width);
  max-height: var(--content-height);
  padding: 0.5em;
}


.mech-gfx-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  height: 90%;
  grid-area: mech;
  margin-top: auto;
}


.buttons {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  grid-area: buttons;
}

.buttons button {
  width: 10em;
  height: 2.5em;
}

.buttons button.cancel span {
  font-size: 0.9em;
}

.buttons button:first-of-type {
  margin-right: 0.5em;
}


.players-list {
  position: relative;
  display: grid;
  grid-template-rows: 3em 1fr;
  overflow: hidden;
  grid-area: players;
}

.players-list header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0.5em;
  background-color: var(--color-secondary);
}

.players-list header button {
  position: relative;
  width: 2em;
  height: 2em;
  padding: 0.25em;
}

.players-list .list-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.players-list ul {
  position: relative;
  list-style: none;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.players-list ul li {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5em;
  width: 100%;
  height: 2em;
  overflow: hidden;
  white-space: nowrap;
}

.players-list ul li:nth-child(even) {
  background-color: #00000030;
}

.players-list .center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}


.profile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 20em;
  max-width: 90%;
  overflow: hidden;
}

.profile header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5em;
  background-color: var(--color-secondary);
}

.profile header span {
  margin-left: 0.5em;
}

.profile header button {
  width: 2em;
  height: 2em;
  stroke: var(--color-text);
}

.profile .sections {
  position: relative;
  display: grid;
  padding: 0.5em;
  gap: 0.5em;
}

.profile section {
  display: grid;
  gap: 0.5em;
}

.profile input {
  margin-bottom: 0.5em;
}

.profile .mech-container {
  position: relative;
  display: flex;
  width: 100%;
  height: 10em;
  justify-content: center;
}

.profile button {
  width: 100%;
  height: 2em;
}



@media (orientation: portrait) {

  main {
    gap: 0.5em;
    grid-template-rows: 3em 1fr 2.5em 0.8fr;
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'mech'
      'buttons'
      'players';
  }

  .buttons button {
    flex: 1;
  }

}

</style>
