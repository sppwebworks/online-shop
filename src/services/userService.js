import { userApi } from "../api/userApi";

export const userService = {
  getAllUsers: (signal) => userApi.getAllUsers(signal),
  createUser: (user) => userApi.createUser(user),
  updateUserRole: (id, role) => userApi.updateUserRole(id, role),
  deleteUser: (id) => userApi.deleteUser(id),
};
