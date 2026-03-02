export const OperationType = {
  CREATE_SPLIT: "create_split",
  UPDATE_SPLIT: "update_split",
  DELETE_SPLIT: "delete_split",
  ADD_MEMBER: "add_member",
  REMOVE_MEMBER: "remove_member",
  CREATE_EXPENSE: "create_expense",
  UPDATE_EXPENSE: "update_expense",
  DELETE_EXPENSE: "delete_expense",
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];
