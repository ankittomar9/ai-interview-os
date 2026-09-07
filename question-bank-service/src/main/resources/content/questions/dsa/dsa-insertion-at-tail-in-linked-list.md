---
slug: dsa-insertion-at-tail-in-linked-list
title: Insertion At Tail In Linked List
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- linked-list
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_6_Insertion_At_Tail_in_Linked_List.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    1 2 3 4'
  expectedOutput: 1 2 3 4 2
  description: Primary test case
- name: Sample 2
  input: '5 1

    10 20 30 40 50'
  expectedOutput: 10 20 30 40 50 1
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    1 2 3'
  expectedOutput: 1 2 3 3
  weight: 25
- name: Hidden 2
  input: '4 0

    4 3 2 1'
  expectedOutput: 4 3 2 1 0
  weight: 25
- name: Hidden 3
  input: '5 2

    1 3 5 7 9'
  expectedOutput: 1 3 5 7 9 2
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
editorial: '### Insertion At Tail In Linked List


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static Node insertAtTail(Node head,int val) {\n        return null;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        Node res = insertAtTail(head, k);\n        while (res != null) {\n            System.out.print(res.data + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static Node insertAtTail(Node head,int val){\n            Node newNode=new Node(val);            if(head==null){ return newNode;}//edge case\n            Node temp=head;\n            while(temp.next!=null){\n                temp=temp.next;\n            }\n           temp.next=newNode;\n           return head;\n    }\n    public static void printList(Node head){\n        Node temp=head;\n            while(temp!=null){\n                System.out.print(temp.data+\" -> \");\n                temp=temp.next;\n            }\n            System.out.print(\"null\" );    }\n    public static class Node{\n        int data;\n        Node next;\n        public Node(int data){\n            this.data=data;\n            this.next=null;\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n\
  \        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        Node res = insertAtTail(head, k);\n        while (res != null) {\n            System.out.print(res.data + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}"
---

### Insertion At Tail In Linked List

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
