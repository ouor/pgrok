import { Disclosure, Menu, Transition } from "@headlessui/react";
import { UserCircleIcon, PlusIcon, TrashIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useUser from "../hooks/useUser";
import axios from "axios";

interface Tunnel {
  ID: number;
  Name: string;
  Token: string;
  Subdomain: string;
  url: string;
}

export default function DashboardPage() {
  const user = useUser();
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSubdomain, setEditSubdomain] = useState("");

  const fetchTunnels = () => {
    axios
      .get("/api/tunnels")
      .then((res) => {
        setTunnels(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTunnels();
  }, []);

  const createTunnel = () => {
    axios
      .post("/api/tunnels")
      .then((res) => {
        setTunnels([...tunnels, { ...res.data, url: "" }]); // Refresh fully is better
        fetchTunnels();
      })
      .catch((err) => alert(err.response?.data || "Failed to create tunnel"));
  };

  const deleteTunnel = (id: number) => {
    if (!confirm("Are you sure you want to delete this tunnel?")) return;
    axios
      .delete(`/api/tunnels/${id}`)
      .then(() => {
        setTunnels(tunnels.filter((t) => t.ID !== id));
      })
      .catch((err) => alert(err.response?.data || "Failed to delete tunnel"));
  };

  const startEditing = (t: Tunnel) => {
    setEditingId(t.ID);
    setEditSubdomain(t.Subdomain);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditSubdomain("");
  };

  const saveSubdomain = (id: number) => {
    axios
      .patch(`/api/tunnels/${id}`, { subdomain: editSubdomain })
      .then(() => {
        setEditingId(null);
        fetchTunnels();
      })
      .catch((err) => alert(err.response?.data || "Failed to update subdomain"));
  };

  return (
    <>
      <div className="min-h-full bg-gray-50">
        <Disclosure as="nav" className="border-b border-gray-200 bg-white">
          {() => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    <div className="flex flex-shrink-0 items-center">
                      <img className="block h-8 w-auto lg:hidden" src="/pgrok.svg" alt="pgrok" />
                      <img className="hidden h-8 w-auto lg:block" src="/pgrok.svg" alt="pgrok" />
                    </div>
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            item.current
                              ? "border-indigo-500 text-gray-900"
                              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:ml-6 sm:flex sm:items-center">
                    <span className="mr-4 text-sm text-gray-500">
                      Hello, {user.displayName}
                    </span>
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <UserCircleIcon className="h-8 w-8 rounded-full text-gray-400" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            <a href="/-/sign-out" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Sign out
                            </a>
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </>
          )}
        </Disclosure>

        <div className="py-10">
          <header className="pb-5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Tunnels</h1>
              <button
                onClick={createTunnel}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Tunnel
              </button>
            </div>
          </header>
          <main>
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
              {loading ? (
                <p className="text-gray-500">Loading tunnels...</p>
              ) : tunnels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tunnels found. Create one to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tunnels.map((t) => (
                    <div key={t.ID} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">{t.Name}</h3>
                        <button
                          onClick={() => deleteTunnel(t.ID)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Tunnel"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="px-4 py-5 sm:p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                          <div className="mt-1 flex items-center">
                            {editingId === t.ID ? (
                              <div className="flex items-center space-x-2 w-full">
                                <input
                                  type="text"
                                  value={editSubdomain}
                                  onChange={(e) => setEditSubdomain(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 border"
                                />
                                <button onClick={() => saveSubdomain(t.ID)} className="text-green-600"><CheckIcon className="h-5 w-5" /></button>
                                <button onClick={cancelEditing} className="text-gray-500"><XMarkIcon className="h-5 w-5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-gray-900">{t.Subdomain}</span>
                                <button onClick={() => startEditing(t)} className="text-gray-400 hover:text-gray-600 ml-2">
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Token</label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <div className="relative flex flex-grow items-stretch focus-within:z-10">
                              <input
                                type="text"
                                readOnly
                                value={t.Token}
                                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 text-gray-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(t.Token);
                                alert("Token copied to clipboard!");
                              }}
                              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Public URL</label>
                          <div className="mt-1 text-sm text-blue-600 truncate">
                            <a href={t.url} target="_blank" rel="noreferrer" className="hover:underline">{t.url}</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const navigation = [{ name: "Tunnels", href: "/", current: true }];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
