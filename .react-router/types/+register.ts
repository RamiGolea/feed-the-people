import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }
}

type Params = {
  "/": {};
  "/forgot-password": {};
  "/reset-password": {};
  "/verify-email": {};
  "/sign-in": {};
  "/sign-up": {};
  "/post-detail/:id": {
    "id": string;
  };
  "/signed-in": {};
  "/messages": {};
  "/messages/new": {};
  "/profile": {};
  "/search": {};
  "/post": {};
};