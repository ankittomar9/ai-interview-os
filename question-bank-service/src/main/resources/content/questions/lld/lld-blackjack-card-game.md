---
slug: lld-blackjack-card-game
title: Design a Blackjack Card Game
track: SPRING_LLD
difficulty: MEDIUM
topics:
- lld
est_minutes: 35
tags:
- object-oriented-design
- lld
- java
- design-patterns
- card-game
- state-pattern
buildProfile: maven-workspace
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Model Card, Suit, and Rank enums, with a Deck class that supports shuffling and multi-deck shoes.
- Encapsulate dynamic Ace valuation (1 or 11) inside a specialized BlackjackHand scoring strategy.
- Use the State Pattern to model player turn states (Hitting, Standing, Bust, Blackjack, Doubling Down).
coaching:
  presentationTips:
  - 'Explain how the Hand score dynamically computes Aces: count as 11 until the total exceeds 21, then downgrade Aces to 1.'
  - Demonstrate how dealer rules (must hit on soft 17) are encapsulated in an automated DealerPlayer policy.
  - Discuss how the Shoe supports reshuffling when cut-card penetration is reached.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>blackjack-card-game</artifactId>
        <version>1.0.0</version>
        <properties>
            <maven.compiler.source>21</maven.compiler.source>
            <maven.compiler.target>21</maven.compiler.target>
            <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
            <junit.jupiter.version>5.11.4</junit.jupiter.version>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>${junit.jupiter.version}</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Blackjack Card Game

    ## Overview
    Implement an object-oriented Blackjack card game supporting dynamic Ace valuation (1 or 11), multi-player turn management, dealer automated rules (hit on < 17), and bet payout resolution.

    ## Key Components
    - `com.interviewos.blackjack.model.Hand`: Encapsulates cards and dynamic score calculation.
    - `com.interviewos.blackjack.service.BlackJackGame`: Coordinates game phases, card dealing, hit/stand actions, and payouts.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/blackjack/model/Hand.java`
    2. `src/main/java/com/interviewos/blackjack/service/BlackJackGame.java`
  src/main/java/com/interviewos/blackjack/model/Suit.java: |
    package com.interviewos.blackjack.model;

    public enum Suit {
        HEARTS,
        SPADES,
        CLUBS,
        DIAMONDS
    }
  src/main/java/com/interviewos/blackjack/model/Rank.java: |
    package com.interviewos.blackjack.model;

    public enum Rank {
        ACE(new int[]{1, 11}),
        TWO(new int[]{2}),
        THREE(new int[]{3}),
        FOUR(new int[]{4}),
        FIVE(new int[]{5}),
        SIX(new int[]{6}),
        SEVEN(new int[]{7}),
        EIGHT(new int[]{8}),
        NINE(new int[]{9}),
        TEN(new int[]{10}),
        JACK(new int[]{10}),
        QUEEN(new int[]{10}),
        KING(new int[]{10});

        private final int[] rankValues;

        Rank(int[] rankValues) {
            this.rankValues = rankValues;
        }

        public int[] getRankValues() {
            return rankValues;
        }
    }
  src/main/java/com/interviewos/blackjack/model/Card.java: |
    package com.interviewos.blackjack.model;

    public class Card {
        private final Rank rank;
        private final Suit suit;

        public Card(Rank rank, Suit suit) {
            this.rank = rank;
            this.suit = suit;
        }

        public Rank getRank() { return rank; }
        public Suit getSuit() { return suit; }
        public int[] getRankValues() { return rank.getRankValues(); }
    }
  src/main/java/com/interviewos/blackjack/model/Deck.java: |
    package com.interviewos.blackjack.model;

    import java.util.*;

    public class Deck {
        private final List<Card> cards = new ArrayList<>();
        private int nextCardIndex = 0;

        public Deck() {
            initializeDeck();
        }

        private void initializeDeck() {
            cards.clear();
            for (Suit suit : Suit.values()) {
                for (Rank rank : Rank.values()) {
                    cards.add(new Card(rank, suit));
                }
            }
            nextCardIndex = 0;
        }

        public void shuffle() {
            Collections.shuffle(cards, new Random(42));
        }

        public Card draw() {
            if (isEmpty() || nextCardIndex >= cards.size()) {
                throw new IllegalStateException("No more cards in deck");
            }
            return cards.get(nextCardIndex++);
        }

        public int getRemainingCardCount() {
            return cards.size() - nextCardIndex;
        }

        public boolean isEmpty() {
            return getRemainingCardCount() == 0;
        }

        public void reset() {
            nextCardIndex = 0;
        }
    }
  src/main/java/com/interviewos/blackjack/model/Hand.java: |
    package com.interviewos.blackjack.model;

    import java.util.*;

    public class Hand {
        private final List<Card> cards = new ArrayList<>();
        private final SortedSet<Integer> possibleValues = new TreeSet<>();

        public void addCard(Card card) {
            // TODO: Add card and update all possible hand values considering Aces (1 or 11)
            throw new UnsupportedOperationException("TODO: Implement addCard");
        }

        public boolean isBust() {
            // TODO: Return true if lowest possible value > 21
            throw new UnsupportedOperationException("TODO: Implement isBust");
        }

        public int getBestValue() {
            // TODO: Return highest possible value <= 21, or lowest if all bust
            throw new UnsupportedOperationException("TODO: Implement getBestValue");
        }

        public List<Card> getCards() { return Collections.unmodifiableList(cards); }
        public SortedSet<Integer> getPossibleValues() { return Collections.unmodifiableSortedSet(possibleValues); }
        public void clear() {
            cards.clear();
            possibleValues.clear();
        }
    }
  src/main/java/com/interviewos/blackjack/model/Action.java: |
    package com.interviewos.blackjack.model;

    public enum Action {
        HIT,
        STAND
    }
  src/main/java/com/interviewos/blackjack/model/GamePhase.java: |
    package com.interviewos.blackjack.model;

    public enum GamePhase {
        STARTED,
        BET_PLACED,
        INITIAL_CARD_DRAWN,
        END
    }
  src/main/java/com/interviewos/blackjack/model/Player.java: |
    package com.interviewos.blackjack.model;

    public interface Player {
        void bet(int amount);
        void loseBet();
        void returnBet();
        void payout();
        boolean isBust();
        Hand getHand();
        int getBalance();
        String getName();
        int getBet();
    }
  src/main/java/com/interviewos/blackjack/model/RealPlayer.java: |
    package com.interviewos.blackjack.model;

    public class RealPlayer implements Player {
        private final String name;
        private final Hand hand = new Hand();
        private int balance;
        private int bet = 0;

        public RealPlayer(String name, int startBalance) {
            this.name = name;
            this.balance = startBalance;
        }

        @Override
        public void bet(int amount) {
            if (amount > balance) throw new IllegalArgumentException("Bet exceeds balance");
            this.bet = amount;
            this.balance -= amount;
        }

        @Override
        public void loseBet() {
            this.bet = 0;
        }

        @Override
        public void returnBet() {
            this.balance += this.bet;
            this.bet = 0;
        }

        @Override
        public void payout() {
            this.balance += this.bet * 2;
            this.bet = 0;
        }

        @Override
        public boolean isBust() { return hand.isBust(); }
        @Override
        public Hand getHand() { return hand; }
        @Override
        public int getBalance() { return balance; }
        @Override
        public String getName() { return name; }
        @Override
        public int getBet() { return bet; }
    }
  src/main/java/com/interviewos/blackjack/model/DealerPlayer.java: |
    package com.interviewos.blackjack.model;

    public class DealerPlayer implements Player {
        private final Hand hand = new Hand();

        @Override
        public void bet(int amount) {}
        @Override
        public void loseBet() {}
        @Override
        public void returnBet() {}
        @Override
        public void payout() {}
        @Override
        public boolean isBust() { return hand.isBust(); }
        @Override
        public Hand getHand() { return hand; }
        @Override
        public int getBalance() { return 0; }
        @Override
        public String getName() { return "Dealer"; }
        @Override
        public int getBet() { return 0; }
    }
  src/main/java/com/interviewos/blackjack/service/BlackJackGame.java: |
    package com.interviewos.blackjack.service;

    import com.interviewos.blackjack.model.*;
    import java.util.*;

    public class BlackJackGame {
        private final Deck deck = new Deck();
        private final List<Player> players = new ArrayList<>();
        private final Player dealer = new DealerPlayer();
        private GamePhase currentPhase = GamePhase.STARTED;

        public BlackJackGame(List<Player> players) {
            if (players != null) {
                this.players.addAll(players);
            }
            deck.shuffle();
        }

        public void placeBet(Player player, int amount) {
            // TODO: Validate phase STARTED and record bet
            throw new UnsupportedOperationException("TODO: Implement placeBet");
        }

        public void dealInitialCards() {
            // TODO: Deal 2 cards to each player and dealer
            throw new UnsupportedOperationException("TODO: Implement dealInitialCards");
        }

        public void hit(Player player) {
            // TODO: Draw card and add to player hand
            throw new UnsupportedOperationException("TODO: Implement hit");
        }

        public void stand(Player player) {
            // TODO: Finalize player turn
            throw new UnsupportedOperationException("TODO: Implement stand");
        }

        public void dealerTurn() {
            // TODO: Dealer hits until best value >= 17, then finalize bets
            throw new UnsupportedOperationException("TODO: Implement dealerTurn");
        }

        public Deck getDeck() { return deck; }
        public List<Player> getPlayers() { return players; }
        public Player getDealer() { return dealer; }
        public GamePhase getCurrentPhase() { return currentPhase; }
    }
editablePaths:
- src/main/java/com/interviewos/blackjack/model/Hand.java
- src/main/java/com/interviewos/blackjack/service/BlackJackGame.java
hiddenTestFiles:
  src/test/java/com/interviewos/blackjack/BlackjackHandScoringTest.java: |
    package com.interviewos.blackjack;

    import com.interviewos.blackjack.model.*;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class BlackjackHandScoringTest {
        @Test
        @DisplayName("Ace dynamically values as 11 or 1 to prevent bust")
        void testAceValuation() {
            Hand hand = new Hand();
            hand.addCard(new Card(Rank.ACE, Suit.SPADES));
            hand.addCard(new Card(Rank.NINE, Suit.HEARTS));

            assertEquals(20, hand.getBestValue(), "Ace + 9 should value as 20");
            assertFalse(hand.isBust());

            hand.addCard(new Card(Rank.FIVE, Suit.CLUBS));
            assertEquals(15, hand.getBestValue(), "Ace + 9 + 5 should downgrade Ace to 1, totaling 15");
            assertFalse(hand.isBust());
        }

        @Test
        @DisplayName("Hand exceeds 21 is marked as bust")
        void testBust() {
            Hand hand = new Hand();
            hand.addCard(new Card(Rank.TEN, Suit.HEARTS));
            hand.addCard(new Card(Rank.JACK, Suit.DIAMONDS));
            hand.addCard(new Card(Rank.FIVE, Suit.SPADES));

            assertTrue(hand.isBust());
            assertTrue(hand.getBestValue() > 21);
        }
    }
  src/test/java/com/interviewos/blackjack/BlackjackDeckTest.java: |
    package com.interviewos.blackjack;

    import com.interviewos.blackjack.model.*;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class BlackjackDeckTest {
        @Test
        @DisplayName("Deck initializes with 52 unique cards and decrements on draw")
        void testDeckDraw() {
            Deck deck = new Deck();
            assertEquals(52, deck.getRemainingCardCount());

            Card c = deck.draw();
            assertNotNull(c);
            assertEquals(51, deck.getRemainingCardCount());
        }
    }
  src/test/java/com/interviewos/blackjack/BlackjackGameFlowTest.java: |
    package com.interviewos.blackjack;

    import com.interviewos.blackjack.model.*;
    import com.interviewos.blackjack.service.BlackJackGame;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import java.util.List;

    import static org.junit.jupiter.api.Assertions.*;

    public class BlackjackGameFlowTest {
        @Test
        @DisplayName("Bet placement transitions phase and deducts balance")
        void testGameBetting() {
            RealPlayer player = new RealPlayer("Bob", 100);
            BlackJackGame game = new BlackJackGame(List.of(player));

            game.placeBet(player, 25);
            assertEquals(25, player.getBet());
            assertEquals(75, player.getBalance());

            game.dealInitialCards();
            assertEquals(2, player.getHand().getCards().size());
            assertEquals(2, game.getDealer().getHand().getCards().size());
        }
    }

starterCode: "public class Card {\n    public final Rank rank;\n    public final Suit suit;\n    public Card(Rank rank, Suit suit) {\n        this.rank = rank;\n        this.suit = suit;\n    }\n    public int[] getRankValues() {\n        return rank.getRankValues();\n    }\n}\n\npublic enum Rank {\n    ACE(new int[] `{1, 11}`),\n    TWO(new int[] `{2}`),\n    THREE(new int[] `{3}`),\n    FOUR(new int[] `{4}`),\n    FIVE(new int[] `{5}`),\n    SIX(new int[] `{6}`),\n    SEVEN(new int[] `{7}`),\n    EIGHT(new int[] `{8}`),\n    NINE(new int[] `{9}`),\n    TEN(new int[] `{10}`),\n    JACK(new int[] `{10}`),\n    QUEEN(new int[] `{10}`),\n    KING(new int[] `{10}`);\n    private final int[] rankValues;\n    Rank(int[] rankValues) {\n        this.rankValues = rankValues;\n    }\n    // Returns the possible values for the rank\npublic int[] getRankValues() {\n        return this.rankValues;\n    }\n}\n\npublic enum Suit {\n    HEARTS,\n    SPADES,\n    CLUBS,\n    DIAMONDS\n}"
solutionCode: "public class Card {\n    public final Rank rank;\n    public final Suit suit;\n    public Card(Rank rank, Suit suit) {\n        this.rank = rank;\n        this.suit = suit;\n    }\n    public int[] getRankValues() {\n        return rank.getRankValues();\n    }\n}\n\npublic enum Rank {\n    ACE(new int[] `{1, 11}`),\n    TWO(new int[] `{2}`),\n    THREE(new int[] `{3}`),\n    FOUR(new int[] `{4}`),\n    FIVE(new int[] `{5}`),\n    SIX(new int[] `{6}`),\n    SEVEN(new int[] `{7}`),\n    EIGHT(new int[] `{8}`),\n    NINE(new int[] `{9}`),\n    TEN(new int[] `{10}`),\n    JACK(new int[] `{10}`),\n    QUEEN(new int[] `{10}`),\n    KING(new int[] `{10}`);\n    private final int[] rankValues;\n    Rank(int[] rankValues) {\n        this.rankValues = rankValues;\n    }\n    // Returns the possible values for the rank\npublic int[] getRankValues() {\n        return this.rankValues;\n    }\n}\n\npublic enum Suit {\n    HEARTS,\n    SPADES,\n    CLUBS,\n    DIAMONDS\n}\n\npublic class\
  \ Deck {\n    int nextCardIndex\n=\n0;\n    List<Card> cards;\n    // Constructor initializes the deck\npublic Deck() {\n        initializeDeck();\n    }\n    // Initializes the deck with all cards\nprivate void initializeDeck() {\n        cards = new ArrayList<>();\n        for (Suit suit : Suit.values()) {\n            for (Rank rank : Rank.values()) {\n                cards.add(new Card(rank, suit));\n            }\n        }\n        nextCardIndex = 0; // Reset to start drawing from the first card\n    }\n    // Shuffles the deck using current time as seed\npublic void shuffle() {\n        Collections.shuffle(cards, new Random(System.currentTimeMillis()));\n    }\n    // Draws the next card from the deck\npublic Card draw() {\n        if (isEmpty() || nextCardIndex >= cards.size()) {\n            throw new IllegalStateException(\"No more cards in deck\");\n        }\n        Card\ndrawCard\n= cards.get(nextCardIndex);\n        nextCardIndex++;\n        return drawCard;\n    }\n   \
  \ // Returns the number of remaining cards in the deck\npublic int getRemainingCardCount() {\n        return cards.size() - nextCardIndex;\n    }\n    // Checks if the deck is empty\npublic boolean isEmpty() {\n        return getRemainingCardCount() == 0;\n    }\n    // Resets the deck to start drawing from the beginning\npublic void reset() {\n        nextCardIndex = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Hand {\n    final List<Card> handCards = new ArrayList<>();\n    // Sorted set of all possible hand values, accounting for Ace flexibility (1 or 11).\nfinal SortedSet<Integer> possibleValues = new TreeSet<>();\n    public Hand() {}\n    // Adds a card to the hand and updates the set of possible total values.\n// For Aces (1 or 11), computes all combinations with existing totals; for other cards, adds\n// their value to each total.\npublic void addCard(Card card) {\n        if (card == null) {\n            throw new IllegalArgumentException(\"Cannot\
  \ add null card to hand\");\n        }\n        handCards.add(card);\n        // card.getRankValues() returns [1, 11] for Aces or a single value (e.g., [10]) for others.\nif (possibleValues.isEmpty()) {\n            // Initialize with the card's values\nfor (int value : card.getRankValues()) {\n                possibleValues.add(value);\n            }\n        } else {\n            // Add all possible card values to each existing total\n            SortedSet<Integer> newPossibleValue = new TreeSet<>();\n            for (int value : possibleValues) {\n                for (int cardValue : card.getRankValues()) {\n                    newPossibleValue.add(value + cardValue);\n                }\n            }\n            possibleValues.clear();\n            possibleValues.addAll(newPossibleValue);\n        }\n    }\n    // Returns an unmodifiable list of cards in the hand\npublic List<Card> getCards() {\n        return Collections.unmodifiableList(handCards);\n    }\n    // Returns an unmodifiable\
  \ sorted set of possible hand values\npublic SortedSet<Integer> getPossibleValues() {\n        return Collections.unmodifiableSortedSet(possibleValues);\n    }\n    // Clears the hand and possible values\npublic void clear() {\n        handCards.clear();\n        possibleValues.clear();\n    }\n    // Checks if the hand is bust (all possible values > 21)\npublic boolean isBust() {\n        // check if all possible value of the player's hand is busted\nif (possibleValues.isEmpty()) {\n            return false;\n        } else {\n            return possibleValues.first() > 21;\n        }\n    }\n}\n\npublic interface Player {\n    void bet(int bet);\n    void loseBet();\n    void returnBet();\n    void payout();\n    boolean isBust();\n    Hand getHand();\n    int getBalance();\n    String getName();\n    int getBet();\n}\n\npublic class RealPlayer\nimplements Player {\n    private final String name;\n    private final Hand hand;\n    private final int bet;\n    private final int balance;\n\
  \    public RealPlayer(String name, int startBalance) {\n        this.name = name;\n        this.hand = new Hand();\n        this.bet = 0;\n        this.balance = startBalance;\n    }\n    // Places a bet for the player\n@Override\n    public void bet(int bet) {\n        if (bet > balance) {\n            throw new IllegalArgumentException(\"Bet is greater than balance\");\n        }\n        this.bet = bet;\n        this.balance -= bet;\n    }\n    // Handles the player losing a bet\n@Override\n    public void loseBet() {\n        this.bet = 0;\n    }\n    // Handles returning the player's bet\n@Override\n    public void returnBet() {\n        this.balance += bet;\n        this.bet = 0;\n    }\n    // Handles the player winning a payout\n@Override\n    public void payout() {\n        this.balance += bet * 2; // Return bet plus equal amount\nthis.bet = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class DealerPlayer\nimplements Player {\n    private final String\n\
  name\n=\n\"Dealer\";\n    private final Hand hand;\n    public DealerPlayer() {\n        this.hand = new Hand();\n    }\n    // Bet-handling methods for Dealer (bet, loseBet, returnBet) are implemented as empty functions.\n@Override\n    public void payout() {\n        // Dealer does not get a payout, so this method only prints the winning hand\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class BlackJackGame {\n    private final Deck\ndeck\n=\nnew Deck();\n    private final List<Player> players = new ArrayList<>();\n    protected final Player\ndealer\n=\nnew DealerPlayer();\n    private Player\ncurrentPlayer\n=\nnull;\n    // Tracks the current status of each player's turn (e.g., HIT or STAND)\n    Map<Player, Action> playerTurnStatusMap = new HashMap<>();\n    GamePhase\ncurrentPhase\n= GamePhase.STARTED;\n    public BlackJackGame(List<Player> players) {\n        for (Player player : players) {\n            if (player == null) throw new IllegalArgumentException();\n\
  \            this.players.add(player);\n            this.playerTurnStatusMap.put(player, null);\n        }\n        this.playerTurnStatusMap.put(dealer, null);\n        deck.shuffle(); // Shuffle the deck when game starts\n    }\n    // Determines the next player who can take an action (i.e., has not stood or bust). If the\n// current player is the dealer, it triggers the dealer's turn.\npublic Player getNextEligiblePlayer() {\n        // If current player hasn't stood or bust, they can continue their turn\nif (currentPlayer != null\n                && !Action.STAND.equals(playerTurnStatusMap.get(currentPlayer))\n                && !currentPlayer.isBust()) {\n            return currentPlayer;\n        }\n        // Find the first player who hasn't stood or bust\nif (currentPlayer == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n        \
  \            return currentPlayer;\n                }\n            }\n        }\n        // else, find the next player after the current one who hasn't stood or bust\nint currentPlayerIndex\n= players.indexOf(currentPlayer);\n        for (int i\n= currentPlayerIndex + 1; i < players.size(); i++) {\n            Player\nplayer\n= players.get(i);\n            if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                if (currentPlayer == dealer) {\n                    if (!Action.STAND.equals(playerTurnStatusMap.get(dealer))) dealerTurn();\n                    return currentPlayer;\n                }\n                currentPlayer = player;\n                return currentPlayer;\n            }\n        }\n        // If no players are left to act, return null\nreturn null;\n    }\n    protected void dealerTurn() {\n        // Dealer hits if below 17\nwhile (dealer.getHand().getPossibleValues().last() < 17) {\n            Card\nnewDraw\n= deck.draw();\n\
  \            dealer.getHand().addCard(newDraw);\n        }\n        playerTurnStatusMap.put(dealer, Action.STAND);\n        checkGameEndCondition();\n    }\n    public void startNewRound() {\n        deck.reset();\n        for (Player player : playerTurnStatusMap.keySet()) {\n            player.getHand().clear(); // Clear player's hand\n        }\n        dealer.getHand().clear(); // Clear dealer's hand\n// Reset all turn statuses to null\n        playerTurnStatusMap.replaceAll((p, v) -> null);\n        currentPlayer = null; // Reset current player\n        currentPhase = GamePhase.STARTED;\n    }\n    public void dealInitialCards() {\n        if (!GamePhase.BET_PLACED.equals(currentPhase)) {\n            throw new IllegalStateException(\"All players must bet before dealing\");\n        }\n        // Deal first card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n        }\n        // Deal first card to dealer\n       \
  \ dealer.getHand().addCard(deck.draw());\n        // Deal second card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n        }\n        // Deal second card to dealer\n        dealer.getHand().addCard(deck.draw());\n        currentPhase = GamePhase.INITIAL_CARD_DRAWN;\n    }\n    public void bet(Player player, int bet) {\n        if (!GamePhase.STARTED.equals(currentPhase)) {\n            throw new IllegalStateException(\"Bets must be placed at the start of the round\");\n        }\n        player.bet(bet);\n        // Transition to BET_PLACED once all players have bet\nif (players.stream()\n                .filter(p -> !(p instanceof DealerPlayer))\n                .allMatch(p -> p.getBet() > 0)) {\n            currentPhase = GamePhase.BET_PLACED;\n        }\n    }\n    public void hit(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player))) {\n            throw new IllegalStateException(\"Player\
  \ has already stood\");\n        }\n        if (player.isBust()) {\n            throw new IllegalStateException(\"Player is already bust\");\n        }\n        Card\ndrawnCard\n= deck.draw();\n        player.getHand().addCard(drawnCard);\n        playerTurnStatusMap.put(player, Action.HIT);\n    }\n    public void stand(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player))) {\n            throw new IllegalStateException(\"Player has already stood\");\n        }\n        if (player.isBust()) {\n            throw new IllegalStateException(\"Player is already bust\");\n        }\n        playerTurnStatusMap.put(player, Action.STAND);\n    }\n    // Checks if the game has ended (all players done), then resolves bets by comparing each\n// player's hand to the dealer's.\nprivate void checkGameEndCondition() {\n        boolean allPlayersDone\n=\n                players.stream()\n                        .allMatch(\n                                p -> Action.STAND.equals(playerTurnStatusMap.get(p))\
  \ || p.isBust());\n        if (!allPlayersDone) {\n            return;\n        }\n        int dealerValue\n= dealer.getHand().getPossibleValues().last();\n        boolean dealerBusts\n= dealer.isBust();\n        for (Player player : players) {\n            if (player.isBust()) {\n                player.loseBet();\n            } else {\n                int playerValue\n= player.getHand().getPossibleValues().last();\n                if (dealerBusts || playerValue > dealerValue) {\n                    player.payout();\n                } else\nif (playerValue == dealerValue) {\n                    player.returnBet();\n                } else {\n                    player.loseBet();\n                }\n            }\n        }\n        currentPhase = GamePhase.END;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic interface PlayerDecisionLogic {\n    // Decides the next action for a player based on their hand\n    Action decideAction(Hand hand);\n}\n\npublic class RealPlayerDecisionLogic\n\
  implements PlayerDecisionLogic {\n    @Override\n    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last() < 16 ? Action.HIT : Action.STAND;\n    }\n}\npublic class DealerDecisionLogic\nimplements PlayerDecisionLogic {\n    @Override\n    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last() < 17 ? Action.HIT : Action.STAND;\n    }\n}\n\npublic interface Player {\n    // Returns the decision logic for the player\n    PlayerDecisionLogic getDecisionLogic(); // ... other methods …\n}\npublic class RealPlayer\nimplements Player {\n    private final PlayerDecisionLogic decisionLogic;\n    public RealPlayer(String name, int startBalance) {\n        this.name = name;\n        this.hand = new Hand();\n        this.bet = 0;\n        this.balance = startBalance;\n        this.decisionLogic = new RealPlayerDecisionLogic();\n    }\n    // Returns the decision logic for the player\n@Override\n    public PlayerDecisionLogic getDecisionLogic()\
  \ {\n        return decisionLogic;\n    }\n    // ... other methods ...\n}\npublic class DealerPlayer\nimplements Player {\n    private final PlayerDecisionLogic decisionLogic;\n    public DealerPlayer() {\n        this.hand = new Hand();\n        this.decisionLogic = new DealerDecisionLogic();\n    }\n    // Returns the decision logic for the dealer\n@Override\n    public PlayerDecisionLogic getDecisionLogic() {\n        return decisionLogic;\n    }\n    // ... other methods ...\n}\n\npublic class BlackJackGame {\n    // ... fields unchanged ...\n// Find the next player who can take an action\npublic Player getNextEligiblePlayer() {\n        // No current player: find first eligible player from the start\nif (currentPlayer == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n                }\n   \
  \         }\n            // Instead of calling dealerTurn(), check if the dealer can act\nif (!Action.STAND.equals(playerTurnStatusMap.get(dealer))) {\n                currentPlayer = dealer;\n                return dealer;\n            }\n        } else {\n            int currentIndex\n= players.indexOf(currentPlayer);\n            for (int i\n= currentIndex + 1; i < players.size(); i++) {\n                Player\nplayer\n= players.get(i);\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n                }\n            }\n            // If all players are done, check if the dealer can act\nif (currentPlayer != dealer && !Action.STAND.equals(playerTurnStatusMap.get(dealer))) {\n                currentPlayer = dealer;\n                return dealer;\n            }\n        }\n        return null; // All turns are complete, including the dealer's\n    }\n\
  \    // Executes the next turn by acting for the next player or dealer.\npublic void playNextTurn() {\n        Player\nnextPlayer\n= getNextEligiblePlayer();\n        if (nextPlayer != null) {\n            performPlayerAction(nextPlayer);\n        }\n    }\n    // Performs the action decided by the player's decision logic (hit or stand).\npublic void performPlayerAction(Player player) {\n        Action\naction\n= player.getDecisionLogic().decideAction(player.getHand());\n        if (action == Action.HIT) {\n            hit(player);\n        } else\nif (action == Action.STAND) {\n            stand(player);\n        }\n    }\n    // ... other methods unchanged, dealerTurn() removed ...\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Blackjack Card Game


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Hand Scoring), State Pattern (Turn Progression), Factory Pattern (Card & Deck Generation)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires adding new implementations without modifying the core coordinator classes.'
referenceSolutions:
- approachId: canonical-blackjack-card-game
  label: Canonical — Design a Blackjack Card Game
  approachClass: PRIMARY
  kind: CODE
  summary: Standard modular object-oriented architecture accepted in technical interviews.
  keyIdea: Optimal separation of concerns with domain entities and state orchestration.
  timeComplexity: O(1)
  spaceComplexity: O(N)
  tradeoffs:
  - Clean encapsulation and single-responsibility principles
  - High maintainability and readability during interview walkthrough
  whenToUse: Default expected interview-grade solution for this problem statement.
  code: "public class Card {\n    public final Rank rank;\n    public final Suit suit;\n    public Card(Rank rank, Suit suit) {\n        this.rank = rank;\n        this.suit = suit;\n    }\n    public int[] getRankValues() {\n        return rank.getRankValues();\n    }\n}\n\npublic enum Rank {\n    ACE(new int[] `{1, 11}`),\n    TWO(new int[] `{2}`),\n    THREE(new int[] `{3}`),\n    FOUR(new int[] `{4}`),\n    FIVE(new int[] `{5}`),\n    SIX(new int[] `{6}`),\n    SEVEN(new int[] `{7}`),\n    EIGHT(new int[] `{8}`),\n    NINE(new int[] `{9}`),\n    TEN(new int[] `{10}`),\n    JACK(new int[] `{10}`),\n    QUEEN(new int[] `{10}`),\n    KING(new int[] `{10}`);\n    private final int[] rankValues;\n    Rank(int[] rankValues) {\n        this.rankValues = rankValues;\n    }\n    // Returns the possible values for the rank\npublic int[] getRankValues() {\n        return this.rankValues;\n    }\n}\n\npublic enum Suit {\n    HEARTS,\n    SPADES,\n    CLUBS,\n    DIAMONDS\n}\n\npublic class Deck\
    \ {\n    int nextCardIndex\n=\n0;\n    List<Card> cards;\n    // Constructor initializes the deck\npublic Deck() {\n        initializeDeck();\n    }\n    // Initializes the deck with all cards\nprivate void initializeDeck() {\n        cards = new ArrayList<>();\n        for (Suit suit : Suit.values()) {\n            for (Rank rank : Rank.values()) {\n                cards.add(new Card(rank, suit));\n            }\n        }\n        nextCardIndex = 0; // Reset to start drawing from the first card\n    }\n    // Shuffles the deck using current time as seed\npublic void shuffle() {\n        Collections.shuffle(cards, new Random(System.currentTimeMillis()));\n    }\n    // Draws the next card from the deck\npublic Card draw() {\n        if (isEmpty() || nextCardIndex >= cards.size()) {\n            throw new IllegalStateException(\"No more cards in deck\");\n        }\n        Card\ndrawCard\n= cards.get(nextCardIndex);\n        nextCardIndex++;\n        return drawCard;\n    }\n    //\
    \ Returns the number of remaining cards in the deck\npublic int getRemainingCardCount() {\n        return cards.size() - nextCardIndex;\n    }\n    // Checks if the deck is empty\npublic boolean isEmpty() {\n        return getRemainingCardCount() == 0;\n    }\n    // Resets the deck to start drawing from the beginning\npublic void reset() {\n        nextCardIndex = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Hand {\n    final List<Card> handCards = new ArrayList<>();\n    // Sorted set of all possible hand values, accounting for Ace flexibility (1 or 11).\nfinal SortedSet<Integer> possibleValues = new TreeSet<>();\n    public Hand() {}\n    // Adds a card to the hand and updates the set of possible total values.\n// For Aces (1 or 11), computes all combinations with existing totals; for other cards, adds\n// their value to each total.\npublic void addCard(Card card) {\n        if (card == null) {\n            throw new IllegalArgumentException(\"Cannot\
    \ add null card to hand\");\n        }\n        handCards.add(card);\n        // card.getRankValues() returns [1, 11] for Aces or a single value (e.g., [10]) for others.\nif (possibleValues.isEmpty()) {\n            // Initialize with the card's values\nfor (int value : card.getRankValues()) {\n                possibleValues.add(value);\n            }\n        } else {\n            // Add all possible card values to each existing total\n            SortedSet<Integer> newPossibleValue = new TreeSet<>();\n            for (int value : possibleValues) {\n                for (int cardValue : card.getRankValues()) {\n                    newPossibleValue.add(value + cardValue);\n                }\n            }\n            possibleValues.clear();\n            possibleValues.addAll(newPossibleValue);\n        }\n    }\n    // Returns an unmodifiable list of cards in the hand\npublic List<Card> getCards() {\n        return Collections.unmodifiableList(handCards);\n    }\n    // Returns an unmodifiable\
    \ sorted set of possible hand values\npublic SortedSet<Integer> getPossibleValues() {\n        return Collections.unmodifiableSortedSet(possibleValues);\n    }\n    // Clears the hand and possible values\npublic void clear() {\n        handCards.clear();\n        possibleValues.clear();\n    }\n    // Checks if the hand is bust (all possible values > 21)\npublic boolean isBust() {\n        // check if all possible value of the player's hand is busted\nif (possibleValues.isEmpty()) {\n            return false;\n        } else {\n            return possibleValues.first() > 21;\n        }\n    }\n}\n\npublic interface Player {\n    void bet(int bet);\n    void loseBet();\n    void returnBet();\n    void payout();\n    boolean isBust();\n    Hand getHand();\n    int getBalance();\n    String getName();\n    int getBet();\n}\n\npublic class RealPlayer\nimplements Player {\n    private final String name;\n    private final Hand hand;\n    private final int bet;\n    private final int balance;\n\
    \    public RealPlayer(String name, int startBalance) {\n        this.name = name;\n        this.hand = new Hand();\n        this.bet = 0;\n        this.balance = startBalance;\n    }\n    // Places a bet for the player\n@Override\n    public void bet(int bet) {\n        if (bet > balance) {\n            throw new IllegalArgumentException(\"Bet is greater than balance\");\n        }\n        this.bet = bet;\n        this.balance -= bet;\n    }\n    // Handles the player losing a bet\n@Override\n    public void loseBet() {\n        this.bet = 0;\n    }\n    // Handles returning the player's bet\n@Override\n    public void returnBet() {\n        this.balance += bet;\n        this.bet = 0;\n    }\n    // Handles the player winning a payout\n@Override\n    public void payout() {\n        this.balance += bet * 2; // Return bet plus equal amount\nthis.bet = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class DealerPlayer\nimplements Player {\n    private final String\n\
    name\n=\n\"Dealer\";\n    private final Hand hand;\n    public DealerPlayer() {\n        this.hand = new Hand();\n    }\n    // Bet-handling methods for Dealer (bet, loseBet, returnBet) are implemented as empty functions.\n@Override\n    public void payout() {\n        // Dealer does not get a payout, so this method only prints the winning hand\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class BlackJackGame {\n    private final Deck\ndeck\n=\nnew Deck();\n    private final List<Player> players = new ArrayList<>();\n    protected final Player\ndealer\n=\nnew DealerPlayer();\n    private Player\ncurrentPlayer\n=\nnull;\n    // Tracks the current status of each player's turn (e.g., HIT or STAND)\n    Map<Player, Action> playerTurnStatusMap = new HashMap<>();\n    GamePhase\ncurrentPhase\n= GamePhase.STARTED;\n    public BlackJackGame(List<Player> players) {\n        for (Player player : players) {\n            if (player == null) throw new IllegalArgumentException();\n\
    \            this.players.add(player);\n            this.playerTurnStatusMap.put(player, null);\n        }\n        this.playerTurnStatusMap.put(dealer, null);\n        deck.shuffle(); // Shuffle the deck when game starts\n    }\n    // Determines the next player who can take an action (i.e., has not stood or bust). If the\n// current player is the dealer, it triggers the dealer's turn.\npublic Player getNextEligiblePlayer() {\n        // If current player hasn't stood or bust, they can continue their turn\nif (currentPlayer != null\n                && !Action.STAND.equals(playerTurnStatusMap.get(currentPlayer))\n                && !currentPlayer.isBust()) {\n            return currentPlayer;\n        }\n        // Find the first player who hasn't stood or bust\nif (currentPlayer == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n      \
    \              return currentPlayer;\n                }\n            }\n        }\n        // else, find the next player after the current one who hasn't stood or bust\nint currentPlayerIndex\n= players.indexOf(currentPlayer);\n        for (int i\n= currentPlayerIndex + 1; i < players.size(); i++) {\n            Player\nplayer\n= players.get(i);\n            if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                if (currentPlayer == dealer) {\n                    if (!Action.STAND.equals(playerTurnStatusMap.get(dealer))) dealerTurn();\n                    return currentPlayer;\n                }\n                currentPlayer = player;\n                return currentPlayer;\n            }\n        }\n        // If no players are left to act, return null\nreturn null;\n    }\n    protected void dealerTurn() {\n        // Dealer hits if below 17\nwhile (dealer.getHand().getPossibleValues().last() < 17) {\n            Card\nnewDraw\n= deck.draw();\n\
    \            dealer.getHand().addCard(newDraw);\n        }\n        playerTurnStatusMap.put(dealer, Action.STAND);\n        checkGameEndCondition();\n    }\n    public void startNewRound() {\n        deck.reset();\n        for (Player player : playerTurnStatusMap.keySet()) {\n            player.getHand().clear(); // Clear player's hand\n        }\n        dealer.getHand().clear(); // Clear dealer's hand\n// Reset all turn statuses to null\n        playerTurnStatusMap.replaceAll((p, v) -> null);\n        currentPlayer = null; // Reset current player\n        currentPhase = GamePhase.STARTED;\n    }\n    public void dealInitialCards() {\n        if (!GamePhase.BET_PLACED.equals(currentPhase)) {\n            throw new IllegalStateException(\"All players must bet before dealing\");\n        }\n        // Deal first card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n        }\n        // Deal first card to dealer\n     \
    \   dealer.getHand().addCard(deck.draw());\n        // Deal second card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n        }\n        // Deal second card to dealer\n        dealer.getHand().addCard(deck.draw());\n        currentPhase = GamePhase.INITIAL_CARD_DRAWN;\n    }\n    public void bet(Player player, int bet) {\n        if (!GamePhase.STARTED.equals(currentPhase)) {\n            throw new IllegalStateException(\"Bets must be placed at the start of the round\");\n        }\n        player.bet(bet);\n        // Transition to BET_PLACED once all players have bet\nif (players.stream()\n                .filter(p -> !(p instanceof DealerPlayer))\n                .allMatch(p -> p.getBet() > 0)) {\n            currentPhase = GamePhase.BET_PLACED;\n        }\n    }\n    public void hit(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player))) {\n            throw new IllegalStateException(\"\
    Player has already stood\");\n        }\n        if (player.isBust()) {\n            throw new IllegalStateException(\"Player is already bust\");\n        }\n        Card\ndrawnCard\n= deck.draw();\n        player.getHand().addCard(drawnCard);\n        playerTurnStatusMap.put(player, Action.HIT);\n    }\n    public void stand(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player))) {\n            throw new IllegalStateException(\"Player has already stood\");\n        }\n        if (player.isBust()) {\n            throw new IllegalStateException(\"Player is already bust\");\n        }\n        playerTurnStatusMap.put(player, Action.STAND);\n    }\n    // Checks if the game has ended (all players done), then resolves bets by comparing each\n// player's hand to the dealer's.\nprivate void checkGameEndCondition() {\n        boolean allPlayersDone\n=\n                players.stream()\n                        .allMatch(\n                                p -> Action.STAND.equals(playerTurnStatusMap.get(p))\
    \ || p.isBust());\n        if (!allPlayersDone) {\n            return;\n        }\n        int dealerValue\n= dealer.getHand().getPossibleValues().last();\n        boolean dealerBusts\n= dealer.isBust();\n        for (Player player : players) {\n            if (player.isBust()) {\n                player.loseBet();\n            } else {\n                int playerValue\n= player.getHand().getPossibleValues().last();\n                if (dealerBusts || playerValue > dealerValue) {\n                    player.payout();\n                } else\nif (playerValue == dealerValue) {\n                    player.returnBet();\n                } else {\n                    player.loseBet();\n                }\n            }\n        }\n        currentPhase = GamePhase.END;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic interface PlayerDecisionLogic {\n    // Decides the next action for a player based on their hand\n    Action decideAction(Hand hand);\n}\n\npublic class RealPlayerDecisionLogic\n\
    implements PlayerDecisionLogic {\n    @Override\n    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last() < 16 ? Action.HIT : Action.STAND;\n    }\n}\npublic class DealerDecisionLogic\nimplements PlayerDecisionLogic {\n    @Override\n    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last() < 17 ? Action.HIT : Action.STAND;\n    }\n}\n\npublic interface Player {\n    // Returns the decision logic for the player\n    PlayerDecisionLogic getDecisionLogic(); // ... other methods …\n}\npublic class RealPlayer\nimplements Player {\n    private final PlayerDecisionLogic decisionLogic;\n    public RealPlayer(String name, int startBalance) {\n        this.name = name;\n        this.hand = new Hand();\n        this.bet = 0;\n        this.balance = startBalance;\n        this.decisionLogic = new RealPlayerDecisionLogic();\n    }\n    // Returns the decision logic for the player\n@Override\n    public PlayerDecisionLogic getDecisionLogic()\
    \ {\n        return decisionLogic;\n    }\n    // ... other methods ...\n}\npublic class DealerPlayer\nimplements Player {\n    private final PlayerDecisionLogic decisionLogic;\n    public DealerPlayer() {\n        this.hand = new Hand();\n        this.decisionLogic = new DealerDecisionLogic();\n    }\n    // Returns the decision logic for the dealer\n@Override\n    public PlayerDecisionLogic getDecisionLogic() {\n        return decisionLogic;\n    }\n    // ... other methods ...\n}\n\npublic class BlackJackGame {\n    // ... fields unchanged ...\n// Find the next player who can take an action\npublic Player getNextEligiblePlayer() {\n        // No current player: find first eligible player from the start\nif (currentPlayer == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n                }\n \
    \           }\n            // Instead of calling dealerTurn(), check if the dealer can act\nif (!Action.STAND.equals(playerTurnStatusMap.get(dealer))) {\n                currentPlayer = dealer;\n                return dealer;\n            }\n        } else {\n            int currentIndex\n= players.indexOf(currentPlayer);\n            for (int i\n= currentIndex + 1; i < players.size(); i++) {\n                Player\nplayer\n= players.get(i);\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player)) && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n                }\n            }\n            // If all players are done, check if the dealer can act\nif (currentPlayer != dealer && !Action.STAND.equals(playerTurnStatusMap.get(dealer))) {\n                currentPlayer = dealer;\n                return dealer;\n            }\n        }\n        return null; // All turns are complete, including the dealer's\n\
    \    }\n    // Executes the next turn by acting for the next player or dealer.\npublic void playNextTurn() {\n        Player\nnextPlayer\n= getNextEligiblePlayer();\n        if (nextPlayer != null) {\n            performPlayerAction(nextPlayer);\n        }\n    }\n    // Performs the action decided by the player's decision logic (hit or stand).\npublic void performPlayerAction(Player player) {\n        Action\naction\n= player.getDecisionLogic().decideAction(player.getHand());\n        if (action == Action.HIT) {\n            hit(player);\n        } else\nif (action == Action.STAND) {\n            stand(player);\n        }\n    }\n    // ... other methods unchanged, dealerTurn() removed ...\n}"
- approachId: rules-strategy-blackjack
  label: Alternate — Parameterized Rules Engine & Dealer Strategy
  approachClass: ALTERNATE
  kind: CODE
  summary: Architects game rules into interchangeable strategies. The GameEngine evaluates turn validity and payout calculations by delegating to a TableRuleset, allowing seamless switching between American, European, and custom casino rules.
  keyIdea: Parameterize dealer decisions (Soft 17 hit/stand, split limits, double down) into pluggable RulesEngine strategies.
  timeComplexity: O(1)
  spaceComplexity: O(N)
  tradeoffs:
  - Supports dynamic table rules without modifying the game loop
  - Additional interface abstractions for rule evaluation
  whenToUse: Ideal for multi-table casino platforms supporting different jurisdictional gaming regulations.
  code: "// Alternate Approach: Parameterized Rules Engine & Dealer Strategy\nimport java.util.*;\n\nenum Suit { HEARTS, DIAMONDS, CLUBS, SPADES }\nenum Rank {\n    TWO(2), THREE(3), FOUR(4), FIVE(5), SIX(6), SEVEN(7), EIGHT(8), NINE(9), TEN(10),\n    JACK(10), QUEEN(10), KING(10), ACE(11);\n    final int value;\n    Rank(int value) { this.value = value; }\n}\n\nclass Card {\n    private final Suit suit;\n    private final Rank rank;\n    public Card(Suit suit, Rank rank) { this.suit = suit; this.rank = rank; }\n    public Rank getRank() { return rank; }\n    public int getValue() { return rank.value; }\n}\n\nclass Hand {\n    private final List<Card> cards = new ArrayList<>();\n    public void addCard(Card card) { cards.add(card); }\n    public List<Card> getCards() { return Collections.unmodifiableList(cards); }\n\n    public int getScore() {\n        int score = 0;\n        int aceCount = 0;\n        for (Card c : cards) {\n            score += c.getValue();\n            if (c.getRank()\
    \ == Rank.ACE) aceCount++;\n        }\n        while (score > 21 && aceCount > 0) {\n            score -= 10;\n            aceCount--;\n        }\n        return score;\n    }\n    public boolean isBusted() { return getScore() > 21; }\n    public boolean isBlackjack() { return cards.size() == 2 && getScore() == 21; }\n}\n\ninterface DealerRuleStrategy {\n    boolean shouldDealerHit(Hand dealerHand);\n}\n\nclass StandardCasinoRules implements DealerRuleStrategy {\n    // Dealer hits on soft 16, stands on all 17s\n    @Override\n    public boolean shouldDealerHit(Hand dealerHand) {\n        return dealerHand.getScore() < 17;\n    }\n}\n\nclass Soft17HitCasinoRules implements DealerRuleStrategy {\n    // Dealer hits on soft 17\n    @Override\n    public boolean shouldDealerHit(Hand dealerHand) {\n        int score = dealerHand.getScore();\n        if (score < 17) return true;\n        if (score == 17) {\n            // Check if hand contains an Ace counted as 11\n            int raw = dealerHand.getCards().stream().mapToInt(Card::getValue).sum();\n\
    \            return raw == 17;\n        }\n        return false;\n    }\n}\n\nclass TableGameEngine {\n    private final DealerRuleStrategy dealerRules;\n    private final Hand playerHand = new Hand();\n    private final Hand dealerHand = new Hand();\n\n    public TableGameEngine(DealerRuleStrategy dealerRules) {\n        this.dealerRules = dealerRules;\n    }\n\n    public void playDealerTurn(Queue<Card> shoe) {\n        while (dealerRules.shouldDealerHit(dealerHand) && !shoe.isEmpty()) {\n            dealerHand.addCard(shoe.poll());\n        }\n    }\n\n    public Hand getPlayerHand() { return playerHand; }\n    public Hand getDealerHand() { return dealerHand; }\n}\n"
---

### Problem Statement: Design a Blackjack Card Game

Design a Casino Blackjack Card Game supporting a multi-deck shoe, standard dealer rules (hit on soft 17), player actions (Hit, Stand, Double Down), and dynamic Ace value calculation.

#### Functional Requirements:
1. **Core Operations**: Implement the primary domain workflows for Design a Blackjack Card Game.
2. **Entity Lifecycle**: Manage state transitions, resource allocation, and validations cleanly.
3. **Tracking & Status**: Provide real-time status inquiries and availability tracking.
4. **Error Handling**: Validate all inputs and handle operational edge cases gracefully with domain-specific exceptions.

#### Non-Functional & Design Goals:
1. **SOLID Principles**: Adhere to Single Responsibility and Open/Closed principles.
2. **Design Patterns**: Leverage Strategy Pattern (Hand Scoring), State Pattern (Turn Progression), Factory Pattern (Card & Deck Generation).
3. **Thread Safety**: Ensure multi-threaded access does not corrupt internal state or produce race conditions.
4. **Clean Code**: Provide well-structured Java interfaces, encapsulation, and type-safe enums.
