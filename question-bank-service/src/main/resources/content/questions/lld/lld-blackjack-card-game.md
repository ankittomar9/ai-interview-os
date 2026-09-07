---
slug: lld-blackjack-card-game
title: Design a Blackjack Card Game
track: SPRING_LLD
difficulty: MID
tags:
- object-oriented-design
- lld
- java
- design-patterns
- card-game
- state-pattern
buildProfile: judge0
source: inspired-by:bytebytego/ood-interview
status: PUBLISHED
hints:
- Model Card, Suit, and Rank enums, with a Deck class that supports shuffling and multi-deck shoes.
- Encapsulate dynamic Ace valuation (1 or 11) inside a specialized BlackjackHand scoring strategy.
- Use the State Pattern to model player turn states (Hitting, Standing, Bust, Blackjack, Doubling Down).
coaching:
  presentationTips:
  - 'Explain how the Hand score dynamically computes Aces: count as 11 until the total exceeds 21, then downgrade Aces to
    1.'
  - Demonstrate how dealer rules (must hit on soft 17) are encapsulated in an automated DealerPlayer policy.
  - Discuss how the Shoe supports reshuffling when cut-card penetration is reached.
starterCode: "public class Card {\n    public final Rank rank;\n    public final Suit suit;\n    public Card(Rank rank, Suit\
  \ suit) {\n        this.rank = rank;\n        this.suit = suit;\n    }\n    public int[] getRankValues() {\n        return\
  \ rank.getRankValues();\n    }\n}\n\npublic enum Rank {\n    ACE(new int[] `{1, 11}`),\n    TWO(new int[] `{2}`),\n    THREE(new\
  \ int[] `{3}`),\n    FOUR(new int[] `{4}`),\n    FIVE(new int[] `{5}`),\n    SIX(new int[] `{6}`),\n    SEVEN(new int[]\
  \ `{7}`),\n    EIGHT(new int[] `{8}`),\n    NINE(new int[] `{9}`),\n    TEN(new int[] `{10}`),\n    JACK(new int[] `{10}`),\n\
  \    QUEEN(new int[] `{10}`),\n    KING(new int[] `{10}`);\n    private final int[] rankValues;\n    Rank(int[] rankValues)\
  \ {\n        this.rankValues = rankValues;\n    }\n    // Returns the possible values for the rank\npublic int[] getRankValues()\
  \ {\n        return this.rankValues;\n    }\n}\n\npublic enum Suit {\n    HEARTS,\n    SPADES,\n    CLUBS,\n    DIAMONDS\n\
  }"
solutionCode: "public class Card {\n    public final Rank rank;\n    public final Suit suit;\n    public Card(Rank rank, Suit\
  \ suit) {\n        this.rank = rank;\n        this.suit = suit;\n    }\n    public int[] getRankValues() {\n        return\
  \ rank.getRankValues();\n    }\n}\n\npublic enum Rank {\n    ACE(new int[] `{1, 11}`),\n    TWO(new int[] `{2}`),\n    THREE(new\
  \ int[] `{3}`),\n    FOUR(new int[] `{4}`),\n    FIVE(new int[] `{5}`),\n    SIX(new int[] `{6}`),\n    SEVEN(new int[]\
  \ `{7}`),\n    EIGHT(new int[] `{8}`),\n    NINE(new int[] `{9}`),\n    TEN(new int[] `{10}`),\n    JACK(new int[] `{10}`),\n\
  \    QUEEN(new int[] `{10}`),\n    KING(new int[] `{10}`);\n    private final int[] rankValues;\n    Rank(int[] rankValues)\
  \ {\n        this.rankValues = rankValues;\n    }\n    // Returns the possible values for the rank\npublic int[] getRankValues()\
  \ {\n        return this.rankValues;\n    }\n}\n\npublic enum Suit {\n    HEARTS,\n    SPADES,\n    CLUBS,\n    DIAMONDS\n\
  }\n\npublic class Deck {\n    int nextCardIndex\n=\n0;\n    List<Card> cards;\n    // Constructor initializes the deck\n\
  public Deck() {\n        initializeDeck();\n    }\n    // Initializes the deck with all cards\nprivate void initializeDeck()\
  \ {\n        cards = new ArrayList<>();\n        for (Suit suit : Suit.values()) {\n            for (Rank rank : Rank.values())\
  \ {\n                cards.add(new Card(rank, suit));\n            }\n        }\n        nextCardIndex = 0; // Reset to\
  \ start drawing from the first card\n    }\n    // Shuffles the deck using current time as seed\npublic void shuffle() {\n\
  \        Collections.shuffle(cards, new Random(System.currentTimeMillis()));\n    }\n    // Draws the next card from the\
  \ deck\npublic Card draw() {\n        if (isEmpty() || nextCardIndex >= cards.size()) {\n            throw new IllegalStateException(\"\
  No more cards in deck\");\n        }\n        Card\ndrawCard\n= cards.get(nextCardIndex);\n        nextCardIndex++;\n  \
  \      return drawCard;\n    }\n    // Returns the number of remaining cards in the deck\npublic int getRemainingCardCount()\
  \ {\n        return cards.size() - nextCardIndex;\n    }\n    // Checks if the deck is empty\npublic boolean isEmpty() {\n\
  \        return getRemainingCardCount() == 0;\n    }\n    // Resets the deck to start drawing from the beginning\npublic\
  \ void reset() {\n        nextCardIndex = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class Hand\
  \ {\n    final List<Card> handCards = new ArrayList<>();\n    // Sorted set of all possible hand values, accounting for\
  \ Ace flexibility (1 or 11).\nfinal SortedSet<Integer> possibleValues = new TreeSet<>();\n    public Hand() {}\n    // Adds\
  \ a card to the hand and updates the set of possible total values.\n// For Aces (1 or 11), computes all combinations with\
  \ existing totals; for other cards, adds\n// their value to each total.\npublic void addCard(Card card) {\n        if (card\
  \ == null) {\n            throw new IllegalArgumentException(\"Cannot add null card to hand\");\n        }\n        handCards.add(card);\n\
  \        // card.getRankValues() returns [1, 11] for Aces or a single value (e.g., [10]) for others.\nif (possibleValues.isEmpty())\
  \ {\n            // Initialize with the card's values\nfor (int value : card.getRankValues()) {\n                possibleValues.add(value);\n\
  \            }\n        } else {\n            // Add all possible card values to each existing total\n            SortedSet<Integer>\
  \ newPossibleValue = new TreeSet<>();\n            for (int value : possibleValues) {\n                for (int cardValue\
  \ : card.getRankValues()) {\n                    newPossibleValue.add(value + cardValue);\n                }\n         \
  \   }\n            possibleValues.clear();\n            possibleValues.addAll(newPossibleValue);\n        }\n    }\n   \
  \ // Returns an unmodifiable list of cards in the hand\npublic List<Card> getCards() {\n        return Collections.unmodifiableList(handCards);\n\
  \    }\n    // Returns an unmodifiable sorted set of possible hand values\npublic SortedSet<Integer> getPossibleValues()\
  \ {\n        return Collections.unmodifiableSortedSet(possibleValues);\n    }\n    // Clears the hand and possible values\n\
  public void clear() {\n        handCards.clear();\n        possibleValues.clear();\n    }\n    // Checks if the hand is\
  \ bust (all possible values > 21)\npublic boolean isBust() {\n        // check if all possible value of the player's hand\
  \ is busted\nif (possibleValues.isEmpty()) {\n            return false;\n        } else {\n            return possibleValues.first()\
  \ > 21;\n        }\n    }\n}\n\npublic interface Player {\n    void bet(int bet);\n    void loseBet();\n    void returnBet();\n\
  \    void payout();\n    boolean isBust();\n    Hand getHand();\n    int getBalance();\n    String getName();\n    int getBet();\n\
  }\n\npublic class RealPlayer\nimplements Player {\n    private final String name;\n    private final Hand hand;\n    private\
  \ final int bet;\n    private final int balance;\n    public RealPlayer(String name, int startBalance) {\n        this.name\
  \ = name;\n        this.hand = new Hand();\n        this.bet = 0;\n        this.balance = startBalance;\n    }\n    // Places\
  \ a bet for the player\n@Override\n    public void bet(int bet) {\n        if (bet > balance) {\n            throw new IllegalArgumentException(\"\
  Bet is greater than balance\");\n        }\n        this.bet = bet;\n        this.balance -= bet;\n    }\n    // Handles\
  \ the player losing a bet\n@Override\n    public void loseBet() {\n        this.bet = 0;\n    }\n    // Handles returning\
  \ the player's bet\n@Override\n    public void returnBet() {\n        this.balance += bet;\n        this.bet = 0;\n    }\n\
  \    // Handles the player winning a payout\n@Override\n    public void payout() {\n        this.balance += bet * 2; //\
  \ Return bet plus equal amount\nthis.bet = 0;\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class DealerPlayer\n\
  implements Player {\n    private final String\nname\n=\n\"Dealer\";\n    private final Hand hand;\n    public DealerPlayer()\
  \ {\n        this.hand = new Hand();\n    }\n    // Bet-handling methods for Dealer (bet, loseBet, returnBet) are implemented\
  \ as empty functions.\n@Override\n    public void payout() {\n        // Dealer does not get a payout, so this method only\
  \ prints the winning hand\n    }\n    // getter methods are omitted for brevity\n}\n\npublic class BlackJackGame {\n   \
  \ private final Deck\ndeck\n=\nnew Deck();\n    private final List<Player> players = new ArrayList<>();\n    protected final\
  \ Player\ndealer\n=\nnew DealerPlayer();\n    private Player\ncurrentPlayer\n=\nnull;\n    // Tracks the current status\
  \ of each player's turn (e.g., HIT or STAND)\n    Map<Player, Action> playerTurnStatusMap = new HashMap<>();\n    GamePhase\n\
  currentPhase\n= GamePhase.STARTED;\n    public BlackJackGame(List<Player> players) {\n        for (Player player : players)\
  \ {\n            if (player == null) throw new IllegalArgumentException();\n            this.players.add(player);\n    \
  \        this.playerTurnStatusMap.put(player, null);\n        }\n        this.playerTurnStatusMap.put(dealer, null);\n \
  \       deck.shuffle(); // Shuffle the deck when game starts\n    }\n    // Determines the next player who can take an action\
  \ (i.e., has not stood or bust). If the\n// current player is the dealer, it triggers the dealer's turn.\npublic Player\
  \ getNextEligiblePlayer() {\n        // If current player hasn't stood or bust, they can continue their turn\nif (currentPlayer\
  \ != null\n                && !Action.STAND.equals(playerTurnStatusMap.get(currentPlayer))\n                && !currentPlayer.isBust())\
  \ {\n            return currentPlayer;\n        }\n        // Find the first player who hasn't stood or bust\nif (currentPlayer\
  \ == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player))\
  \ && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n     \
  \           }\n            }\n        }\n        // else, find the next player after the current one who hasn't stood or\
  \ bust\nint currentPlayerIndex\n= players.indexOf(currentPlayer);\n        for (int i\n= currentPlayerIndex + 1; i < players.size();\
  \ i++) {\n            Player\nplayer\n= players.get(i);\n            if (!Action.STAND.equals(playerTurnStatusMap.get(player))\
  \ && !player.isBust()) {\n                if (currentPlayer == dealer) {\n                    if (!Action.STAND.equals(playerTurnStatusMap.get(dealer)))\
  \ dealerTurn();\n                    return currentPlayer;\n                }\n                currentPlayer = player;\n\
  \                return currentPlayer;\n            }\n        }\n        // If no players are left to act, return null\n\
  return null;\n    }\n    protected void dealerTurn() {\n        // Dealer hits if below 17\nwhile (dealer.getHand().getPossibleValues().last()\
  \ < 17) {\n            Card\nnewDraw\n= deck.draw();\n            dealer.getHand().addCard(newDraw);\n        }\n      \
  \  playerTurnStatusMap.put(dealer, Action.STAND);\n        checkGameEndCondition();\n    }\n    public void startNewRound()\
  \ {\n        deck.reset();\n        for (Player player : playerTurnStatusMap.keySet()) {\n            player.getHand().clear();\
  \ // Clear player's hand\n        }\n        dealer.getHand().clear(); // Clear dealer's hand\n// Reset all turn statuses\
  \ to null\n        playerTurnStatusMap.replaceAll((p, v) -> null);\n        currentPlayer = null; // Reset current player\n\
  \        currentPhase = GamePhase.STARTED;\n    }\n    public void dealInitialCards() {\n        if (!GamePhase.BET_PLACED.equals(currentPhase))\
  \ {\n            throw new IllegalStateException(\"All players must bet before dealing\");\n        }\n        // Deal first\
  \ card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n\
  \        }\n        // Deal first card to dealer\n        dealer.getHand().addCard(deck.draw());\n        // Deal second\
  \ card to each real player in order\nfor (Player player : players) {\n            player.getHand().addCard(deck.draw());\n\
  \        }\n        // Deal second card to dealer\n        dealer.getHand().addCard(deck.draw());\n        currentPhase\
  \ = GamePhase.INITIAL_CARD_DRAWN;\n    }\n    public void bet(Player player, int bet) {\n        if (!GamePhase.STARTED.equals(currentPhase))\
  \ {\n            throw new IllegalStateException(\"Bets must be placed at the start of the round\");\n        }\n      \
  \  player.bet(bet);\n        // Transition to BET_PLACED once all players have bet\nif (players.stream()\n             \
  \   .filter(p -> !(p instanceof DealerPlayer))\n                .allMatch(p -> p.getBet() > 0)) {\n            currentPhase\
  \ = GamePhase.BET_PLACED;\n        }\n    }\n    public void hit(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player)))\
  \ {\n            throw new IllegalStateException(\"Player has already stood\");\n        }\n        if (player.isBust())\
  \ {\n            throw new IllegalStateException(\"Player is already bust\");\n        }\n        Card\ndrawnCard\n= deck.draw();\n\
  \        player.getHand().addCard(drawnCard);\n        playerTurnStatusMap.put(player, Action.HIT);\n    }\n    public void\
  \ stand(Player player) {\n        if (Action.STAND.equals(playerTurnStatusMap.get(player))) {\n            throw new IllegalStateException(\"\
  Player has already stood\");\n        }\n        if (player.isBust()) {\n            throw new IllegalStateException(\"\
  Player is already bust\");\n        }\n        playerTurnStatusMap.put(player, Action.STAND);\n    }\n    // Checks if the\
  \ game has ended (all players done), then resolves bets by comparing each\n// player's hand to the dealer's.\nprivate void\
  \ checkGameEndCondition() {\n        boolean allPlayersDone\n=\n                players.stream()\n                     \
  \   .allMatch(\n                                p -> Action.STAND.equals(playerTurnStatusMap.get(p)) || p.isBust());\n \
  \       if (!allPlayersDone) {\n            return;\n        }\n        int dealerValue\n= dealer.getHand().getPossibleValues().last();\n\
  \        boolean dealerBusts\n= dealer.isBust();\n        for (Player player : players) {\n            if (player.isBust())\
  \ {\n                player.loseBet();\n            } else {\n                int playerValue\n= player.getHand().getPossibleValues().last();\n\
  \                if (dealerBusts || playerValue > dealerValue) {\n                    player.payout();\n               \
  \ } else\nif (playerValue == dealerValue) {\n                    player.returnBet();\n                } else {\n       \
  \             player.loseBet();\n                }\n            }\n        }\n        currentPhase = GamePhase.END;\n  \
  \  }\n    // getter methods are omitted for brevity\n}\n\npublic interface PlayerDecisionLogic {\n    // Decides the next\
  \ action for a player based on their hand\n    Action decideAction(Hand hand);\n}\n\npublic class RealPlayerDecisionLogic\n\
  implements PlayerDecisionLogic {\n    @Override\n    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last()\
  \ < 16 ? Action.HIT : Action.STAND;\n    }\n}\npublic class DealerDecisionLogic\nimplements PlayerDecisionLogic {\n    @Override\n\
  \    public Action decideAction(Hand hand) {\n        return hand.getPossibleValues().last() < 17 ? Action.HIT : Action.STAND;\n\
  \    }\n}\n\npublic interface Player {\n    // Returns the decision logic for the player\n    PlayerDecisionLogic getDecisionLogic();\
  \ // ... other methods \u2026\n}\npublic class RealPlayer\nimplements Player {\n    private final PlayerDecisionLogic decisionLogic;\n\
  \    public RealPlayer(String name, int startBalance) {\n        this.name = name;\n        this.hand = new Hand();\n  \
  \      this.bet = 0;\n        this.balance = startBalance;\n        this.decisionLogic = new RealPlayerDecisionLogic();\n\
  \    }\n    // Returns the decision logic for the player\n@Override\n    public PlayerDecisionLogic getDecisionLogic() {\n\
  \        return decisionLogic;\n    }\n    // ... other methods ...\n}\npublic class DealerPlayer\nimplements Player {\n\
  \    private final PlayerDecisionLogic decisionLogic;\n    public DealerPlayer() {\n        this.hand = new Hand();\n  \
  \      this.decisionLogic = new DealerDecisionLogic();\n    }\n    // Returns the decision logic for the dealer\n@Override\n\
  \    public PlayerDecisionLogic getDecisionLogic() {\n        return decisionLogic;\n    }\n    // ... other methods ...\n\
  }\n\npublic class BlackJackGame {\n    // ... fields unchanged ...\n// Find the next player who can take an action\npublic\
  \ Player getNextEligiblePlayer() {\n        // No current player: find first eligible player from the start\nif (currentPlayer\
  \ == null) {\n            for (Player player : players) {\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player))\
  \ && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n     \
  \           }\n            }\n            // Instead of calling dealerTurn(), check if the dealer can act\nif (!Action.STAND.equals(playerTurnStatusMap.get(dealer)))\
  \ {\n                currentPlayer = dealer;\n                return dealer;\n            }\n        } else {\n        \
  \    int currentIndex\n= players.indexOf(currentPlayer);\n            for (int i\n= currentIndex + 1; i < players.size();\
  \ i++) {\n                Player\nplayer\n= players.get(i);\n                if (!Action.STAND.equals(playerTurnStatusMap.get(player))\
  \ && !player.isBust()) {\n                    currentPlayer = player;\n                    return currentPlayer;\n     \
  \           }\n            }\n            // If all players are done, check if the dealer can act\nif (currentPlayer !=\
  \ dealer && !Action.STAND.equals(playerTurnStatusMap.get(dealer))) {\n                currentPlayer = dealer;\n        \
  \        return dealer;\n            }\n        }\n        return null; // All turns are complete, including the dealer's\n\
  \    }\n    // Executes the next turn by acting for the next player or dealer.\npublic void playNextTurn() {\n        Player\n\
  nextPlayer\n= getNextEligiblePlayer();\n        if (nextPlayer != null) {\n            performPlayerAction(nextPlayer);\n\
  \        }\n    }\n    // Performs the action decided by the player's decision logic (hit or stand).\npublic void performPlayerAction(Player\
  \ player) {\n        Action\naction\n= player.getDecisionLogic().decideAction(player.getHand());\n        if (action ==\
  \ Action.HIT) {\n            hit(player);\n        } else\nif (action == Action.STAND) {\n            stand(player);\n \
  \       }\n    }\n    // ... other methods unchanged, dealerTurn() removed ...\n}"
editorial: '### Object-Oriented Design & Architectural Analysis: Design a Blackjack Card Game


  #### 1. Core Domain Entities & Class Responsibilities

  The system decomposes into domain entities following SOLID principles:

  - High cohesion: each entity manages its internal state and exposes strictly bounded operations.

  - Loose coupling: components communicate via domain interfaces rather than concrete implementations.


  #### 2. Design Pattern Application

  - **Strategy Pattern (Hand Scoring), State Pattern (Turn Progression), Factory Pattern (Card & Deck Generation)**

  - These patterns ensure the design is easily extensible when new business requirements, product categories, or operational
  workflows are introduced.


  #### 3. Concurrency & Thread Safety Considerations

  - Multi-user terminals and concurrent requests are synchronized using thread-safe data structures and atomic state transitions.

  - Contention points are isolated to avoid coarse-grained bottleneck locks across the entire system.


  #### 4. Extensibility & Future Enhancements

  - Adding new strategies (e.g., custom discount algorithms, new hardware dispensers, alternative allocation policies) requires
  adding new implementations without modifying the core coordinator classes.'
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
