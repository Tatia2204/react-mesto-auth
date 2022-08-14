import React, {useEffect} from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import Header from './Header.js';
import Main from './Main.js';
import Footer from "./Footer.js";
import ImagePopup from "./ImagePopup.js";
import { CurrentUser } from "../contexts/CurrentUser.js";
import api from "../utils/api.js";
import * as auth from "../utils/auth.js";
import EditProfilePopup from "./EditProfilePopup.js";
import EditAvatarPopup from "./EditAvatarPopup.js";
import AddPlacePopup from "./AddPlacePopup.js";
import PopupWithForm from "./PopupWithForm.js";
import Register from "./Register.js";
import ProtectedRoute from "./ProtectedRoute.js";
import Login from "./Login.js";
import InfoTooltip from "./InfoTooltip.js";

function App() {
    const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
    const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
    const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
    const [isFormatPopupOpen, setIsFormatPopupOpen] = React.useState(false);
    const [selectedCard, setSelectedCard] = React.useState({});
    const [currentUser, setCurrentUser] = React.useState({});
    const [cards, setCards] = React.useState([]);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isRegister, setIsRegister] = React.useState(false);
    const [isInfoTooltipOpen, setIsInfoTooltipOpen] = React.useState(false);
    const [userEmail, setUserEmail] = React.useState('');
    const history = useHistory();

    function handleEditAvatarHandler() {
        setIsEditAvatarPopupOpen(!isEditAvatarPopupOpen);
    }

    function handleEditProfileHandler() {
        setIsEditProfilePopupOpen(!isEditProfilePopupOpen);
    }

    function handleAddPlaceHandler() {
        setIsAddPlacePopupOpen(!isAddPlacePopupOpen);
    }

    function handleInfoTooltip() {
        setIsInfoTooltipOpen(!isInfoTooltipOpen);
    }

    function handleCardClickDelete() {
        setIsFormatPopupOpen(!isFormatPopupOpen);
    }

    function closeAllPopups() {
        setIsEditAvatarPopupOpen(false);
        setIsEditProfilePopupOpen(false);
        setIsAddPlacePopupOpen(false);
        setIsFormatPopupOpen(false)
        setSelectedCard({});
        setIsInfoTooltipOpen(false);
    }

    function handleCardClick(card) {
        setSelectedCard(card);
    }

    function handleUpdateUser(newProfileInfo) {
        api.changeProfileInfo(newProfileInfo)
            .then((data) => {
                setCurrentUser(data);
                closeAllPopups();
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    }

    function handleUpdateAvatar(data) {
        api.changeProfileAvatar(data)
            .then((data) => {
                setCurrentUser(data);
                closeAllPopups();
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    }

    function handleAddPlaceSubmit(data) {
        api.addNewCard(data)
            .then((newCard) => {
                setCards([newCard, ...cards]);
                closeAllPopups();
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    };

    function handleCardLike(card) {

        const isLiked = card.likes.some(i => i._id === currentUser._id);
        api.changeLikeCardStatus(card._id, !isLiked)
            .then((newCard) => {
                setCards((state) => state.map((c) => c._id === card._id ? newCard : c));
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    }

    function handleCardDelete(cardId) {
        api.deleteCard(cardId)
            .then(() => {
                setCards((cards) => cards.filter(card => card._id !== cardId));
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    }

    function handleAuthorization(data) {
        return auth
            .authorize(data)
            .then((res) => {
                setIsLoggedIn(true);
                setUserEmail(data.email);
                console.log("Тест", data);
                localStorage.setItem('jwt', res.token);
                history.push('/');
            })
            .catch((err) => {
                console.log(err);
                handleInfoTooltip();
            });

    }

    function handleRegister(data) {
        return auth
            .register(data)
            .then(() => {
                setIsRegister(true);
                handleInfoTooltip();
                history.push('/sign-in');
            })
            .catch((err) => {
                console.log(err);
                setIsRegister(false);
                handleInfoTooltip();
            });
    }

    function handleLogout() {
        setIsLoggedIn(false);
        localStorage.removeItem('jwt');
        history.push('/sign-in');
    }

    function handleTokenCheck() {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            return;
        }
        auth
            .getContent(jwt)
            .then(() => {
                setIsLoggedIn(true);
                localStorage.getItem('jwt');
            });
    }

    useEffect(() => {
        handleTokenCheck();
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            history.push('/sign-in');
        }
    }, [isLoggedIn]);

    useEffect(() => {
        api.getProfileInfo()
            .then((data) => {
                setCurrentUser(data);
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
        api.getInitialCards()
            .then((data) => {
                setCards(data);
            })
            .catch((err) => {
                console.log(`Ошибка: ${err}`);
            });
    }, []);

    return (
        <CurrentUser.Provider value={currentUser}>

            <div className="page">
                <Header loggedIn={isLoggedIn} userEmail={userEmail} onLogout={handleLogout} onRegister={isRegister}/>
                <Switch>
                    <Route path="/sign-up">
                        <Register onRegister={handleRegister} />
                    </Route>
                    <Route path="/sign-in">
                        <Login onLogin={handleAuthorization}/>
                    </Route>
                    <ProtectedRoute
                        exact path="/"
                        loggedIn={isLoggedIn}
                        component={Main}
                        onEditAvatar={handleEditAvatarHandler}
                        onEditProfile={handleEditProfileHandler}
                        onAddPlace={handleAddPlaceHandler}
                        onCardClick={handleCardClick}
                        cards={cards}
                        onCardLike={handleCardLike}
                        onCardClickDelete={handleCardClickDelete}
                        onCardDelete={handleCardDelete}
                    />
                </Switch>
                <Footer />
                <ImagePopup
                    card={selectedCard}
                    onClose={closeAllPopups}
                />

                <InfoTooltip
                    isConfirmed={isRegister}
                    onClose={closeAllPopups}
                    isOpen={isInfoTooltipOpen}
                />

                <EditProfilePopup
                    isOpen={isEditProfilePopupOpen}
                    onClose={closeAllPopups}
                    onUpdateUser={handleUpdateUser}
                />

                <EditAvatarPopup
                    isOpen={isEditAvatarPopupOpen}
                    onClose={closeAllPopups}
                    onUpdateAvatar={handleUpdateAvatar}
                />

                <AddPlacePopup
                    isOpen={isAddPlacePopupOpen}
                    onClose={closeAllPopups}
                    onAddPlace={handleAddPlaceSubmit}
                />

                <PopupWithForm
                    popup="delete"
                    onClose={closeAllPopups}
                    name="formDelete"
                    title="Вы уверены?"
                    text="Да"
                >
                </PopupWithForm>

            </div>

        </CurrentUser.Provider >
    );
}

export default App;


