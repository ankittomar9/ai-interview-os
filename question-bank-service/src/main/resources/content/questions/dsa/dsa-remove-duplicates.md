---
slug: dsa-remove-duplicates
title: Remove Duplicates
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- linked-list
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_15_Remove_Duplicates.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    1 2 3 4'
  expectedOutput: 1 2 3 4
  description: Primary test case
- name: Sample 2
  input: '5

    10 20 30 40 50'
  expectedOutput: 10 20 30 40 50
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    42'
  expectedOutput: '42'
  weight: 25
- name: Hidden 2
  input: '3

    5 1 9'
  expectedOutput: 5 1 9
  weight: 25
- name: Hidden 3
  input: '4

    1 2 2 1'
  expectedOutput: 1 2 1
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
editorial: '### Remove Duplicates


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static Node deleteDuplicates(Node head) {\n        return null;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        Node res = deleteDuplicates(head);\n        while (res != null) {\n            System.out.print(res.data + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static Node deleteDuplicates(Node head){\n        if(head==null || head.next==null){ return head;}\n        Node current=head;\n        while(current!=null && current.next!=null){\n            if(current.data ==current.next.data){\n                current.next=current.next.next;\n            }else{\n                current=current.next;\n            }\n        }\n        return head;\n    }\n    public static void printList(Node head){\n Node temp=head;while(temp!=null){System.out.print(temp.data+ \" -> \");temp=temp.next;} \n System.out.println(\"null\");}\n public static class Node{\n         int data;  Node next;      public Node(int data){ this.data=data; this.next=null;} }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int\
  \ i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        Node res = deleteDuplicates(head);\n        while (res != null) {\n            System.out.print(res.data + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}"
---

### Remove Duplicates

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
