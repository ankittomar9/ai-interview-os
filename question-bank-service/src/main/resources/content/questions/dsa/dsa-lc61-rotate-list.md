---
slug: dsa-lc61-rotate-list
title: Rotate List
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MID
tags:
- linked-list
- mid
- lc-61
buildProfile: judge0
source: inspired-by:operator-corpus/Q_65_Rotate_List.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4 2

    1 2 3 4'
  expectedOutput: 3 4 1 2
  description: Primary test case
- name: Sample 2
  input: '5 1

    10 20 30 40 50'
  expectedOutput: 50 10 20 30 40
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '3 3

    1 2 3'
  expectedOutput: 1 2 3
  weight: 25
- name: Hidden 2
  input: '4 0

    4 3 2 1'
  expectedOutput: 4 3 2 1
  weight: 25
- name: Hidden 3
  input: '5 2

    1 3 5 7 9'
  expectedOutput: 7 9 1 3 5
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
editorial: '### Rotate List


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static ListNode rotateRight(ListNode head,int k) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n        ListNode head = dummy.next;\n        ListNode res = rotateRight(head, k);\n        while (res != null) {\n            System.out.print(res.val + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static ListNode rotateRight(ListNode head,int k){\n        if(head==null || head.next==null || k==0){ return head;        }\n\n        int length=1;        ListNode tail=head;\n            while(tail.next!=null){\n                tail=tail.next;\n                length++;\n            }\n            tail.next=head;\n            k=k%length;\n            if(k==0){\n                tail.next=null;\n                return head;\n            }\n\n            ListNode newTail= head;\n            for(int i=0;i<length-k-1;i++){\n                newTail=newTail.next;\n            }\n            ListNode newHead=newTail.next;\n            newTail.next=null;\n            return newHead;\n    }\n    public static String listToString(ListNode head){\n        StringBuilder sb=new StringBuilder();\n        sb.append(\"[\"); ListNode temp=head;\n        while(temp!=null){\n            sb.append(temp.val);\n            if(temp.next!=null){\
  \ sb.append(\", \");}\n            temp=temp.next;\n        }\n        sb.append(\"]\");return sb.toString();\n    }\n    public static class ListNode{\n        int val;ListNode next;public ListNode(){};public ListNode(int val){this.val=val;}\n        public ListNode(int val,ListNode next){this.val=val;this.next=next;}\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        int k = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n        ListNode head = dummy.next;\n        ListNode res = rotateRight(head, k);\n        while (res != null) {\n            System.out.print(res.val + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}"
---

### Rotate List

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
