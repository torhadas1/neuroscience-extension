// TowerGame/GameScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TowerGame.css';
import targetTowerImage from './images/towerGoal.png';

const GameScreen = ({ onComplete }) => {
    const navigate = useNavigate();
    const [timer, setTimer] = useState(120); // 2 minutes in seconds
    const [isGameOver, setIsGameOver] = useState(false);

    const [towers, setTowers] = useState({
        A: [], // Left tower
        B: ['green', 'orange'], // Middle tower
        C: ['red', 'blue', 'yellow'], // Right tower
    });

    const goalTower = ['blue', 'green', 'red', 'orange', 'yellow'];

    const [selectedDisk, setSelectedDisk] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [planningTime, setPlanningTime] = useState(null);
    const [totalMoves, setTotalMoves] = useState(0);
    const [gameStartTime, setGameStartTime] = useState(null);

    // Timer effect
    useEffect(() => {
        setGameStartTime(Date.now());

        if (arraysEqual(towers.B, goalTower)) {
            setIsGameOver(true);
            onComplete();
            const totalTime = 120 - timer;
            // Save to localStorage
            localStorage.setItem(
                'towerGame',
                JSON.stringify({
                    planningTime,
                    totalTime,
                    totalMoves: totalMoves + 1, // Include current move
                })
            );
            setTimeout(() => {
                navigate('../end-transition', { state: { completed: true } });
            }, 2000);
        }
        if (timer > 0 && !isGameOver) {

            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0) {
            setIsGameOver(true);
            const totalTime = 120 - timer;
            localStorage.setItem(
                'towerGame',
                JSON.stringify({
                    planningTime,
                    totalTime,
                    totalMoves: totalMoves + 1, // Include current move
                })
            );
            setTimeout(() => {
                navigate('../end-transition', { state: { completed: false } });
            }, 2000);
        }

    }, [timer, isGameOver, navigate]);

    const handleDiskClick = (towerKey) => {

        if (isGameOver) return;

        const towerDisks = towers[towerKey];
        if (towerDisks.length === 0) return;

        // Start the game timer on the first move
        if (totalMoves === 0) {
            setPlanningTime(120 - timer);

        }

        // Select the top disk
        if (!selectedDisk) {
            setSelectedDisk({ disk: towerDisks[towerDisks.length - 1], from: towerKey });
            setMoveHistory((prev) => [
                ...prev,
                { disk: towerDisks[towerDisks.length - 1], from: towerKey, to: towerKey },
            ]);
        }

    };

    const handleTowerClick = (towerKey) => {
        if (isGameOver || !selectedDisk) return;



        // Move the disk
        setTowers((prevTowers) => {
            const newTowers = { ...prevTowers };
            // Remove disk from original tower
            newTowers[selectedDisk.from] = newTowers[selectedDisk.from].slice(0, -1);
            // Add disk to new tower
            newTowers[towerKey] = [...newTowers[towerKey], selectedDisk.disk];
            return newTowers;
        });

        setMoveHistory((prev) => [...prev, { disk: selectedDisk.disk, from: selectedDisk.from, to: towerKey }]);
        setSelectedDisk(null);
        setTotalMoves((prev) => prev + 1);

        // Check if the game is completed
        if (arraysEqual(towers.B, goalTower)) {
            setIsGameOver(true);
            const totalTime = 120 - timer;
            // Save to localStorage
            localStorage.setItem(
                'towerGame',
                JSON.stringify({
                    planningTime,
                    totalTime,
                    totalMoves: totalMoves + 1, // Include current move
                })
            );
            setTimeout(() => {
                navigate('../end-transition', { state: { completed: true } });
            }, 2000);
        }
    };
    const handleUndo = () => {
        if (moveHistory.length === 0 || isGameOver) return;
        const lastMove = moveHistory.pop(); // Remove the last move from history
        setMoveHistory(moveHistory); // Update the state
        setTowers((prevTowers) => {
            const newTowers = { ...prevTowers };
            // Remove disk from current tower
            newTowers[lastMove.to] = newTowers[lastMove.to].slice(0, -1);
            // Add disk back to original tower
            newTowers[lastMove.from] = [...newTowers[lastMove.from], lastMove.disk];
            return newTowers;
        });
        
        // Update selectedDisk based on the undone move
        if (lastMove.from === lastMove.to) {
            // If the undone move was a lift, deselect the disk
            setSelectedDisk(null);
        } else {
            // If the undone move was a tower change, re-select the disk in its lifted position
            setSelectedDisk({ disk: lastMove.disk, from: lastMove.from });
        }
    };

    const handleRestart = () => {
        setTowers({
            A: [],
            B: ['green', 'orange'],
            C: ['red', 'blue', 'yellow'],
        });
        setSelectedDisk(null);
        setPlanningTime(null);
        setGameStartTime(null);
        // setTimer(120);
        // setIsGameOver(false);
    };

    const arraysEqual = (a1, a2) => {
        return JSON.stringify(a1) === JSON.stringify(a2);
    };

    // Rendering functions for towers and disks
    const renderTower = (towerKey) => {
        const disks = towers[towerKey];
        return (
            <div
                className="tower"
                onClick={() => handleTowerClick(towerKey)}
            >
                <div className="tower-base"></div>
                {disks.map((disk, index) => (
                    <div
                        key={index}
                        className={`disk ${disk}`}
                        onClick={() => handleDiskClick(towerKey)}
                        style={{
                            top:
                                selectedDisk && selectedDisk.from === towerKey && index === disks.length - 1
                                    ? "-50px" // Lift the selected disk
                                    : `${-27 * (index - 4.5)}px`,
                            transition: "top 0.2s ease",
                        }}
                    ></div>
                ))}
                {/* Placeholder for empty tower */}
                {<div className="disk-placeholder"></div>}
            </div>
        );
    };

    return (
        <div className="tower-game">
            <button className="menu-button" onClick={() => navigate('/')}>
                Menu
            </button>
            <div className="game-box">
                <div className="game-header">
                    <div className="timer">
                        <span role="img" aria-label="timer">
                            ⏱️
                        </span>{' '}
                        {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}
                    </div>
                    <div className="goal-towers">
                        {/* Render the goal state towers */}
                        <img src={targetTowerImage} alt="goal towers" style={{ width: '200px' }} />
                    </div>
                </div>

                <div className='game-text'>Target Towers</div>
                <div className="player-towers">
                    <div className="towers-container">
                        {['A', 'B', 'C'].map((towerKey) => renderTower(towerKey))}
                    </div>
                </div>
                <div className="game-buttons">
                    <button className="dark-blue-button" onClick={handleRestart}>
                        Restart
                    </button>
                    <button className="light-blue-button" onClick={handleUndo}>
                        Undo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;
