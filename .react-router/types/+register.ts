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
  "/direct-messages": {};
  "/post-detail/:id": {
    "id": string;
  };
  "/messages/new": {};
  "/leaderboard": {};
  "/signed-in": {};
  "/profile": {};
  "/search": {};
  "/post": {};
};