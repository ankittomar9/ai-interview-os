---
slug: dsa-search-element-in-the-linkedlist
title: Search Element In The Linkedlist
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [linked-list]
est_minutes: 25
tags:
- linked-list
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_4_Search_element_in_the_LinkedList.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    1 2 3 4'
  expectedOutput: 'Original Linked List

    1 -> 2 -> true'
  description: Primary test case
- name: Sample 2
  input: '5 1

    10 20 30 40 50'
  expectedOutput: 'Original Linked List

    10 -> 20 -> 30 -> 40 -> 50 -> false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    1 2 3'
  expectedOutput: 'Original Linked List

    1 -> 2 -> 3 -> true'
  weight: 25
- name: Hidden 2
  input: '4 0

    4 3 2 1'
  expectedOutput: 'Original Linked List

    4 -> 3 -> 2 -> 1 -> false'
  weight: 25
- name: Hidden 3
  input: '5 2

    1 3 5 7 9'
  expectedOutput: 'Original Linked List

    1 -> 3 -> 5 -> 7 -> 9 -> false'
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
editorial: '### Search Element In The Linkedlist


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean findTarget(Node head,int target) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next; }\n        Node head = dummy.next;\n        System.out.println(findTarget(head, k));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n   \n    public static boolean findTarget(Node head,int target){\n        boolean isFound=false;     Node temp=head;\n         System.out.println(\"Original Linked List\");\n        while(temp!=null){\n            System.out.print(temp.data + \" -> \");\n                       if(temp.data==target){\n                         return true;\n                       }\n            temp=temp.next;\n        }\n        return false;\n    }\n    public static class Node{\n        int data;\n        Node next;\n        Node(int data){\n            this.data=data;\n            this.next=null;        }    }   \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        Node dummy = new Node(0);\n        Node cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new Node(sc.nextInt()); cur = cur.next;\
  \ }\n        Node head = dummy.next;\n        System.out.println(findTarget(head, k));\n    }\n}"
---

### Search Element In The Linkedlist

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
