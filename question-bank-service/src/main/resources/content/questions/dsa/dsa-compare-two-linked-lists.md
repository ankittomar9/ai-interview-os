---
slug: dsa-compare-two-linked-lists
title: Compare Two Linked Lists
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [linked-list]
est_minutes: 25
tags:
- linked-list
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_9_Compare_Two_Linked_Lists.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3

    1 2 4

    3

    1 3 4'
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: '2

    1 5

    2

    2 6'
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    0

    1

    0'
  expectedOutput: 'true'
  weight: 25
- name: Hidden 2
  input: '3

    2 4 6

    3

    1 3 5'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: '2

    10 20

    2

    30 40'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Linked List algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Linked List techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Compare Two Linked Lists


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean compareLists(Node head1,Node head2) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        Node dummy1 = new Node(0);\n        Node cur1 = dummy1;\n        for (int i = 0; i < n1; i++) { cur1.next = new Node(sc.nextInt()); cur1 = cur1.next; }\n        int n2 = sc.nextInt();\n        Node dummy2 = new Node(0);\n        Node cur2 = dummy2;\n        for (int i = 0; i < n2; i++) { cur2.next = new Node(sc.nextInt()); cur2 = cur2.next; }\n        System.out.println(compareLists(dummy1.next, dummy2.next));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static boolean compareLists(Node head1,Node head2){\n        Node temp1=head1; Node temp2=head2;\n        while(temp1!=null && temp2!=null){\n            if(temp1.data!=temp2.data){\n                return false;            }\n            temp1=temp1.next;\n            temp2=temp2.next;\n        }\n        boolean result = (temp1== null && temp2==null);\n        return result;\n    }\n    public static void printList(Node head){\n        Node temp=head;\n        while(temp!=null){\n           System.out.print(temp.data+\" -> \");\n            temp=temp.next;\n        }\n        System.out.println(\"null\");\n    }\n\n    public static class Node{\n        int data;    Node next;\n        public Node(int data){\n            this.data=data;\n            this.next=null;\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n\
  \        int n1 = sc.nextInt();\n        Node dummy1 = new Node(0);\n        Node cur1 = dummy1;\n        for (int i = 0; i < n1; i++) { cur1.next = new Node(sc.nextInt()); cur1 = cur1.next; }\n        int n2 = sc.nextInt();\n        Node dummy2 = new Node(0);\n        Node cur2 = dummy2;\n        for (int i = 0; i < n2; i++) { cur2.next = new Node(sc.nextInt()); cur2 = cur2.next; }\n        System.out.println(compareLists(dummy1.next, dummy2.next));\n    }\n}"
---

### Compare Two Linked Lists

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
