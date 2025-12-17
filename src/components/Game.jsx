import * as THREE from 'three';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { activateMode, deActivateMode } from './keyPress';
import { movement } from './movement';
import { useGameStore } from '../store/useGameStore';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import GameSocketDetails from './GameSocketDetails';

function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState({});
  const [user, setUser] = useState(null);
  const gameContainerRef = useRef(null);
  const lastPositionRef = useRef([0, 0, 0]);
  const otherPlayersRef = useRef({});
  const sceneRef = useRef(null);
  const gltfModelRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/app');
      return;
    }
    setUser(JSON.parse(userData));

    const newSocket = io('http://localhost:4005');
    setSocket(newSocket);
    
    newSocket.emit('join-room', roomId);
    
    // Emit player join
    newSocket.emit('player-join', {
      roomId,
      username: JSON.parse(userData).username,
      position: [0, 0, 0]
    });
    

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      setPlayers(prev => ({
        ...prev,
        [data.username]: data.position || [0, 0, 0]
      }));
    });

    newSocket.on('player-moved', (data) => {
      console.log('Player moved:', data);
      setPlayers(prev => ({
        ...prev,
        [data.username]: data.position
      }));
    });


    newSocket.on('player-left', (data) => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[data.username];
        return newPlayers;
      });
    });

    return () => {
      if (user) {
        newSocket.emit('player-leave', {
          roomId,
          username: user.username
        });
      }
      newSocket.close();
    };


  }, [roomId, navigate]);


  // Handle player creation when players state changes
  useEffect(() => {
    if (!sceneRef.current || !gltfModelRef.current) return;

    const createOtherPlayer = (username, position) => {
      if (otherPlayersRef.current[username]) return; // Already exists
      
      console.log('Creating player:', username, position);
      const otherPlayerModel = gltfModelRef.current.scene.clone();
      otherPlayerModel.position.set(position[0], position[1], position[2]);
      
      // Make other players red for visibility
      otherPlayerModel.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color.setHex(0xff0000); // Red color for other players
        }
      });
      
      sceneRef.current.add(otherPlayerModel);
      otherPlayersRef.current[username] = otherPlayerModel;
      
      console.log('Player created successfully:', username);
    };

    // Create new players
    Object.entries(players).forEach(([username, position]) => {
      createOtherPlayer(username, position);
    });

    // Remove players that left
    Object.keys(otherPlayersRef.current).forEach(username => {
      if (!players[username]) {
        console.log('Removing player:', username);
        sceneRef.current.remove(otherPlayersRef.current[username]);
        delete otherPlayersRef.current[username];
      }
    });
  }, [players]);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameContainerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    camera.position.set(0, 4, 20);
    scene.add(camera);

    const Alight = new THREE.AmbientLight('white', 1);
    scene.add(Alight);

    const gridHelper = new THREE.GridHelper(20);
    scene.add(gridHelper);
    const orbitcontrol = new OrbitControls(camera, renderer.domElement);

    const plane1geo = new THREE.PlaneGeometry(20, 20);
    const plane1mat = new THREE.MeshBasicMaterial({ color: 'white' });
    const floor = new THREE.Mesh(plane1geo, plane1mat);
    floor.rotation.x = -0.5 * Math.PI;
    scene.add(floor);

    const { setModel, setMixer, setCurrentAction, setAnimations, setCurrentAnimationIndex } = useGameStore.getState();

    const loader = new GLTFLoader();
    
    // Load main player model
    loader.load('/models/person.glb', (gltf) => {
      gltfModelRef.current = gltf;
      
      const model = gltf.scene.clone();
      const animations = gltf.animations;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      const currentAction = mixer.clipAction(animations[3]);
      currentAction.play();

      setModel(model);
      setMixer(mixer);
      setAnimations(animations);
      setCurrentAction(currentAction);
      setCurrentAnimationIndex(3);
      setModelLoaded(true);
      console.log('✅ Model loaded and ready');
    });

    const handleKeyDown = (e) => {
      try {
        activateMode(e);
      } catch (error) {
        console.warn('Key down error:', error);
      }
    };

    const handleKeyUp = (e) => {
      try {
        deActivateMode(e);
      } catch (error) {
        console.warn('Key up error:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId;
    function animate() {
      animationId = window.requestAnimationFrame(animate);
      try {
        // Only call movement if model is loaded
        if (modelLoaded) {
          movement(camera);
        }
        
        // Check for position changes and emit to other players
        const { model } = useGameStore.getState();
        if (model && socket && user) {
          const currentPos = [model.position.x, model.position.y, model.position.z];
          const lastPos = lastPositionRef.current;
          
          // Only emit if position changed significantly
          if (Math.abs(currentPos[0] - lastPos[0]) > 0.1 || 
              Math.abs(currentPos[2] - lastPos[2]) > 0.1) {
            socket.emit('player-move', {
              roomId,
              username: user.username,
              position: currentPos
            });
            lastPositionRef.current = currentPos;
          }
        }
        
        // Update other players positions
        Object.entries(players).forEach(([username, position]) => {
          if (otherPlayersRef.current[username]) {
            const playerModel = otherPlayersRef.current[username];
            playerModel.position.set(position[0], position[1], position[2]);
          }
        });
        
        orbitcontrol.update();
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('Animation error:', error);
      }
    }

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      try {
        // Remove other players
        Object.values(otherPlayersRef.current).forEach(playerModel => {
          scene.remove(playerModel);
        });
        otherPlayersRef.current = {};
        
        if (gameContainerRef.current && renderer.domElement && gameContainerRef.current.contains(renderer.domElement)) {
          gameContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, [socket, user, roomId, modelLoaded]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />
      {/* <GameSocketDetails 
        players={players}
        user={user}
        roomId={roomId}
        socket={socket}
      /> */}
    </div>
  )
}

export default Game
