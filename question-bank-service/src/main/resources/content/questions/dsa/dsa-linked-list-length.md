---
slug: dsa-linked-list-length
title: Linked List Length
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- linked-list
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_3_Linked_List_Length.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    1 2 3 4'
  expectedOutput: "1 -> 2 -> 3 -> 4 -> \n4"
  description: Primary test case
- name: Sample 2
  input: '5

    10 20 30 40 50'
  expectedOutput: "10 -> 20 -> 30 -> 40 -> 50 -> \n5"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    42'
  expectedOutput: "42 -> \n1"
  weight: 25
- name: Hidden 2
  input: '3

    5 1 9'
  expectedOutput: "5 -> 1 -> 9 -> \n3"
  weight: 25
- name: Hidden 3
  input: '4

    1 2 2 1'
  expectedOutput: "1 -> 2 -> 2 -> 1 -> \n4"
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
editorial: '### Linked List Length


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static int getLength(Node head) {\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        System.out.println(getLength(head));\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static int getLength(Node head){\n        int count=0;        Node temp=head;\n        while(temp!=null){\n            System.out.print(temp.data + \" -> \");\n            count++;\n            temp=temp.next;\n        }\n        // System.out.println(\"null\");\n         System.out.println();\n        return count;\n    }\n    public static class Node{\n        int data;\n        Node next;\n        Node(int data){\n            this.data=data;\n            this.next=null;\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        System.out.println(getLength(head));\n    }\n}"
---

### Linked List Length

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
