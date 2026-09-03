import React, { useMemo, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { usePagination } from "../../hooks/usePagination";
import { userService } from "../../services/userService";
import { useAdminAuth } from "../../context/AdminAuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatCard from "../../components/admin/StatCard";
import Pagination from "../../components/admin/Pagination";
import styles from "./AdminUsersPage.module.css";

const PAGE_SIZE = 10;

const emptyForm = { name: "", email: "", password: "", role: "customer" };

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const AdminUsersPage = () => {
  const { user: currentUser } = useAdminAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const {
    data: users,
    loading,
    error,
    refetch,
  } = useFetch((signal) => userService.getAllUsers(signal));

  const stats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, customers: 0 };
    const admins = users.filter((u) => u.role === "admin").length;
    return { total: users.length, admins, customers: users.length - admins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const matchesTerm =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesTerm && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const {
    page,
    setPage,
    totalPages,
    pageItems: pageUsers,
    totalItems,
  } = usePagination(filteredUsers, PAGE_SIZE);

  const resetToFirstPage = () => setPage(1);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      await userService.createUser(formValues);
      setFormValues(emptyForm);
      setIsAdding(false);
      refetch();
    } catch (err) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === "admin" ? "customer" : "admin";
    try {
      await userService.updateUserRole(user.id, nextRole);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to update role");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.name}" (${user.email})?`)) return;
    try {
      await userService.deleteUser(user.id);
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to delete user");
    }
  };

  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>
            Manage customer and admin accounts. Customers can also
            self-register from the site's Login page.
          </p>
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            setFormError("");
            setIsAdding((prev) => !prev);
          }}
        >
          {isAdding ? "Cancel" : "+ Add User"}
        </button>
      </div>

      <div className={styles.grid}>
        <StatCard icon="👥" label="Total Users" value={stats.total} accent="indigo" />
        <StatCard icon="🛡️" label="Admins" value={stats.admins} accent="purple" />
        <StatCard icon="🛍️" label="Customers" value={stats.customers} accent="green" />
      </div>

      {isAdding && (
        <form className={styles.form} onSubmit={handleAddUser}>
          <h2 className={styles.formTitle}>New Account</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="newUserName">
                Name
              </label>
              <input
                id="newUserName"
                type="text"
                value={formValues.name}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, name: e.target.value }))
                }
                className={styles.input}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="newUserEmail">
                Email
              </label>
              <input
                id="newUserEmail"
                type="email"
                value={formValues.email}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, email: e.target.value }))
                }
                className={styles.input}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="newUserPassword">
                Password
              </label>
              <input
                id="newUserPassword"
                type="password"
                value={formValues.password}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className={styles.input}
                minLength={6}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="newUserRole">
                Role
              </label>
              <select
                id="newUserRole"
                value={formValues.role}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, role: e.target.value }))
                }
                className={styles.input}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {formError && <div className={styles.formError}>{formError}</div>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
          className={styles.searchInput}
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            resetToFirstPage();
          }}
          className={styles.filterSelect}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className={styles.noResultsStandalone}>No users found</div>
      ) : (
      <div className={styles.listWrapper}>
        <table className={styles.list}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <span
                        className={`${styles.avatar} ${
                          user.role === "admin" ? styles.avatarAdmin : styles.avatarCustomer
                        }`}
                      >
                        {initials(user.name) || "?"}
                      </span>
                      <div>
                        <p className={styles.name}>
                          {user.name}{" "}
                          {isSelf && <span className={styles.you}>(you)</span>}
                        </p>
                        <p className={styles.email}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        user.role === "admin" ? styles.roleAdmin : styles.roleCustomer
                      }
                    >
                      {user.role === "admin" ? "🛡️ Admin" : "Customer"}
                    </span>
                  </td>
                  <td className={styles.joined}>
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => handleToggleRole(user)}
                      className={styles.roleButton}
                      disabled={isSelf}
                      title={isSelf ? "You can't change your own role" : undefined}
                    >
                      {user.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className={styles.deleteButton}
                      disabled={isSelf}
                      title={isSelf ? "You can't delete your own account" : "Delete"}
                      aria-label={`Delete ${user.name}`}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
      </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
