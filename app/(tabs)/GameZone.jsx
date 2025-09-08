import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GameZone = () => {
  const navigation = useNavigation();
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  const games = [
    {
      id: 'memory-cards',
      title: 'Memory Cards',
      description: 'Match pairs of cards to improve memory',
      icon: '🃏',
      difficulty: 'Easy',
      color: '#4CAF50',
    },
    {
      id: 'word-search',
      title: 'Word Search',
      description: 'Find hidden words in the puzzle',
      icon: '🔍',
      difficulty: 'Medium',
      color: '#2196F3',
    },
    {
      id: 'number-sequence',
      title: 'Number Sequence',
      description: 'Complete the number pattern',
      icon: '🔢',
      difficulty: 'Easy',
      color: '#FF9800',
    },
    {
      id: 'color-memory',
      title: 'Color Memory',
      description: 'Remember the sequence of colors',
      icon: '🎨',
      difficulty: 'Easy',
      color: '#E91E63',
    },
    {
      id: 'trivia',
      title: 'Trivia Quiz',
      description: 'Answer questions about various topics',
      icon: '❓',
      difficulty: 'Medium',
      color: '#9C27B0',
    },
    {
      id: 'puzzle',
      title: 'Picture Puzzle',
      description: 'Arrange pieces to complete the picture',
      icon: '🧩',
      difficulty: 'Medium',
      color: '#607D8B',
    },
  ];

  const startGame = (gameId) => {
    setSelectedGame(gameId);
    setGameScore(0);
    setGameTime(0);
    setIsGameActive(true);
  };

  const endGame = (finalScore) => {
    setGameScore(finalScore);
    setIsGameActive(false);
    Alert.alert(
      'Game Complete!',
      `Your score: ${finalScore}`,
      [{ text: 'OK', onPress: () => setSelectedGame(null) }]
    );
  };

  const renderGameContent = () => {
    switch (selectedGame) {
      case 'memory-cards':
        return <MemoryCardsGame onEndGame={endGame} />;
      case 'word-search':
        return <WordSearchGame onEndGame={endGame} />;
      case 'number-sequence':
        return <NumberSequenceGame onEndGame={endGame} />;
      case 'color-memory':
        return <ColorMemoryGame onEndGame={endGame} />;
      case 'trivia':
        return <TriviaGame onEndGame={endGame} />;
      case 'puzzle':
        return <PuzzleGame onEndGame={endGame} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Game Zone</Text>
          <Text style={styles.headerSubtitle}>
            Fun games to keep your mind sharp and active
          </Text>
        </View>

        <View style={styles.gamesGrid}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { borderLeftColor: game.color }]}
              onPress={() => startGame(game.id)}
            >
              <Text style={styles.gameIcon}>{game.icon}</Text>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: game.color }]}>
                <Text style={styles.difficultyText}>{game.difficulty}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for Better Gaming</Text>
          <Text style={styles.tipText}>• Take breaks between games</Text>
          <Text style={styles.tipText}>• Play regularly for best results</Text>
          <Text style={styles.tipText}>• Don't worry about perfect scores</Text>
          <Text style={styles.tipText}>• Have fun and enjoy the process!</Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedGame !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGame(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {games.find(g => g.id === selectedGame)?.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedGame(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gameContainer}>
              {renderGameContent()}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Memory Cards Game Component
const MemoryCardsGame = ({ onEndGame }) => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);

  const cardSymbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const gameCards = [...cardSymbols, ...cardSymbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
  };

  const handleCardPress = (cardId) => {
    if (flippedCards.length >= 2) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      const [firstCard, secondCard] = newFlippedCards;
      const firstSymbol = cards.find(c => c.id === firstCard)?.symbol;
      const secondSymbol = cards.find(c => c.id === secondCard)?.symbol;

      if (firstSymbol === secondSymbol) {
        setMatchedPairs(matchedPairs + 1);
        setCards(cards.map(card => 
          card.id === firstCard || card.id === secondCard
            ? { ...card, isMatched: true }
            : card
        ));
        setFlippedCards([]);
        
        if (matchedPairs + 1 === cardSymbols.length) {
          setTimeout(() => onEndGame(moves + 1), 500);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  return (
    <View style={styles.memoryGameContainer}>
      <Text style={styles.gameScore}>Moves: {moves} | Pairs: {matchedPairs}/{cardSymbols.length}</Text>
      <View style={styles.cardsGrid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.memoryCard,
              (flippedCards.includes(card.id) || card.isMatched) && styles.flippedCard
            ]}
            onPress={() => handleCardPress(card.id)}
          >
            <Text style={styles.cardSymbol}>
              {(flippedCards.includes(card.id) || card.isMatched) ? card.symbol : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Word Search Game Component
const WordSearchGame = ({ onEndGame }) => {
  const [words] = useState(['CAT', 'DOG', 'BIRD', 'FISH']);
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);

  const grid = [
    ['C', 'A', 'T', 'X', 'Y'],
    ['D', 'O', 'G', 'Z', 'W'],
    ['B', 'I', 'R', 'D', 'V'],
    ['F', 'I', 'S', 'H', 'U'],
    ['Q', 'R', 'S', 'T', 'N']
  ];

  const handleCellPress = (row, col) => {
    const letter = grid[row][col];
    const word = words.find(w => w.includes(letter));
    
    if (word && !foundWords.includes(word)) {
      setFoundWords([...foundWords, word]);
      setScore(score + 10);
      
      if (foundWords.length + 1 === words.length) {
        setTimeout(() => onEndGame(score + 10), 500);
      }
    }
  };

  return (
    <View style={styles.wordSearchContainer}>
      <Text style={styles.gameScore}>Score: {score} | Found: {foundWords.length}/{words.length}</Text>
      <View style={styles.wordGrid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.wordRow}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={styles.wordCell}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              >
                <Text style={styles.wordCellText}>{cell}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.wordsList}>
        <Text style={styles.wordsTitle}>Find these words:</Text>
        {words.map((word, index) => (
          <Text
            key={index}
            style={[
              styles.wordItem,
              foundWords.includes(word) && styles.foundWord
            ]}
          >
            {word}
          </Text>
        ))}
      </View>
    </View>
  );
};

// Number Sequence Game Component
const NumberSequenceGame = ({ onEndGame }) => {
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    generateSequence();
  }, []);

  const generateSequence = () => {
    const newSequence = [];
    for (let i = 0; i < 5; i++) {
      newSequence.push(Math.floor(Math.random() * 10) + 1);
    }
    setSequence(newSequence);
    setCurrentStep(0);
    setUserInput('');
  };

  const handleNumberPress = (number) => {
    const newInput = userInput + number;
    setUserInput(newInput);

    if (newInput.length === sequence.length) {
      if (newInput === sequence.join('')) {
        setScore(score + 10);
        setCurrentStep(currentStep + 1);
        if (currentStep >= 2) {
          setTimeout(() => onEndGame(score + 10), 500);
        } else {
          setTimeout(() => generateSequence(), 1000);
        }
      } else {
        Alert.alert('Incorrect!', 'Try again.');
        setUserInput('');
      }
    }
  };

  return (
    <View style={styles.numberGameContainer}>
      <Text style={styles.gameScore}>Score: {score} | Step: {currentStep + 1}/3</Text>
      <Text style={styles.sequenceTitle}>Remember this sequence:</Text>
      <View style={styles.sequenceDisplay}>
        {sequence.map((num, index) => (
          <Text key={index} style={styles.sequenceNumber}>{num}</Text>
        ))}
      </View>
      <Text style={styles.inputTitle}>Your input: {userInput}</Text>
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.numberButton}
            onPress={() => handleNumberPress(num.toString())}
          >
            <Text style={styles.numberButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Color Memory Game Component
const ColorMemoryGame = ({ onEndGame }) => {
  const [colors] = useState(['🔴', '🟡', '🔵', '🟢', '🟠', '🟣']);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    generateSequence();
  }, []);

  const generateSequence = () => {
    const newSequence = [];
    for (let i = 0; i < 4; i++) {
      newSequence.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    setSequence(newSequence);
    setUserSequence([]);
    setCurrentStep(0);
    showSequence();
  };

  const showSequence = () => {
    setIsShowing(true);
    setTimeout(() => setIsShowing(false), 2000);
  };

  const handleColorPress = (color) => {
    if (isShowing) return;

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      if (JSON.stringify(newUserSequence) === JSON.stringify(sequence)) {
        setScore(score + 10);
        setCurrentStep(currentStep + 1);
        if (currentStep >= 2) {
          setTimeout(() => onEndGame(score + 10), 500);
        } else {
          setTimeout(() => generateSequence(), 1000);
        }
      } else {
        Alert.alert('Incorrect!', 'Try again.');
        setUserSequence([]);
      }
    }
  };

  return (
    <View style={styles.colorGameContainer}>
      <Text style={styles.gameScore}>Score: {score} | Step: {currentStep + 1}/3</Text>
      <Text style={styles.sequenceTitle}>Watch the sequence:</Text>
      <View style={styles.colorSequence}>
        {sequence.map((color, index) => (
          <Text
            key={index}
            style={[
              styles.colorDisplay,
              !isShowing && styles.hiddenColor
            ]}
          >
            {color}
          </Text>
        ))}
      </View>
      <Text style={styles.inputTitle}>Now repeat the sequence:</Text>
      <View style={styles.colorGrid}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={styles.colorButton}
            onPress={() => handleColorPress(color)}
          >
            <Text style={styles.colorButtonText}>{color}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Trivia Game Component
const TriviaGame = ({ onEndGame }) => {
  const [questions] = useState([
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correct: 1
    },
    {
      question: "How many days are in a week?",
      options: ["5", "6", "7", "8"],
      correct: 2
    },
    {
      question: "What color do you get when you mix red and blue?",
      options: ["Green", "Purple", "Orange", "Yellow"],
      correct: 1
    }
  ]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    
    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 10);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        onEndGame(score + (answerIndex === questions[currentQuestion].correct ? 10 : 0));
      }
    }, 1000);
  };

  return (
    <View style={styles.triviaContainer}>
      <Text style={styles.gameScore}>Score: {score} | Question: {currentQuestion + 1}/{questions.length}</Text>
      <Text style={styles.questionText}>{questions[currentQuestion].question}</Text>
      <View style={styles.optionsContainer}>
        {questions[currentQuestion].options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === index && styles.selectedOption,
              selectedAnswer !== null && index === questions[currentQuestion].correct && styles.correctOption
            ]}
            onPress={() => handleAnswerSelect(index)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Puzzle Game Component
const PuzzleGame = ({ onEndGame }) => {
  const [puzzlePieces] = useState(['🧩', '🧩', '🧩', '🧩', '🧩', '🧩', '🧩', '🧩', '🧩']);
  const [arrangedPieces, setArrangedPieces] = useState([]);
  const [score, setScore] = useState(0);

  const handlePiecePress = (index) => {
    if (arrangedPieces.length < puzzlePieces.length) {
      setArrangedPieces([...arrangedPieces, puzzlePieces[index]]);
      setScore(score + 10);
      
      if (arrangedPieces.length + 1 === puzzlePieces.length) {
        setTimeout(() => onEndGame(score + 10), 500);
      }
    }
  };

  return (
    <View style={styles.puzzleContainer}>
      <Text style={styles.gameScore}>Score: {score} | Pieces: {arrangedPieces.length}/{puzzlePieces.length}</Text>
      <Text style={styles.puzzleTitle}>Arrange the puzzle pieces:</Text>
      <View style={styles.puzzleArea}>
        {arrangedPieces.map((piece, index) => (
          <Text key={index} style={styles.puzzlePiece}>{piece}</Text>
        ))}
      </View>
      <View style={styles.piecesContainer}>
        {puzzlePieces.map((piece, index) => (
          <TouchableOpacity
            key={index}
            style={styles.pieceButton}
            onPress={() => handlePiecePress(index)}
          >
            <Text style={styles.pieceText}>{piece}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE9FE',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#567396',
    textAlign: 'center',
    marginTop: 5,
  },
  gamesGrid: {
    padding: 20,
    paddingTop: 10,
  },
  gameCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  difficultyBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#567396',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  gameContainer: {
    flex: 1,
  },
  gameScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Memory Cards Styles
  memoryGameContainer: {
    flex: 1,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  memoryCard: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    margin: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  flippedCard: {
    backgroundColor: '#fff',
    borderColor: '#567396',
  },
  cardSymbol: {
    fontSize: 24,
  },
  // Word Search Styles
  wordSearchContainer: {
    flex: 1,
  },
  wordGrid: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  wordRow: {
    flexDirection: 'row',
  },
  wordCell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  wordCellText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  wordsList: {
    marginTop: 20,
  },
  wordsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    marginBottom: 10,
  },
  wordItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  foundWord: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  // Number Game Styles
  numberGameContainer: {
    flex: 1,
  },
  sequenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 10,
  },
  sequenceDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sequenceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#567396',
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  inputTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numberButton: {
    width: 50,
    height: 50,
    backgroundColor: '#567396',
    margin: 5,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Color Game Styles
  colorGameContainer: {
    flex: 1,
  },
  colorSequence: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorDisplay: {
    fontSize: 40,
    marginHorizontal: 10,
  },
  hiddenColor: {
    opacity: 0.3,
  },
  inputTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    margin: 5,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonText: {
    fontSize: 30,
  },
  // Trivia Styles
  triviaContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#567396',
  },
  correctOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  // Puzzle Styles
  puzzleContainer: {
    flex: 1,
  },
  puzzleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#567396',
    textAlign: 'center',
    marginBottom: 20,
  },
  puzzleArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  puzzlePiece: {
    fontSize: 30,
    margin: 5,
  },
  piecesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pieceButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  pieceText: {
    fontSize: 30,
  },
});

export default GameZone;
