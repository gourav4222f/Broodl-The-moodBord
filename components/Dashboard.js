"use client"

import React, { useState, useEffect } from 'react'
import { Fugaz_One } from "next/font/google";
import Calender from './Calender';
import { useAuth } from '@/context/AuthContext';
import { average, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import Login from './Login';
import Loading from './Loading';

const fugaz = Fugaz_One({ subsets: ['latin'], weight: ['400'] })
export default function Dashboard() {

    const { currentUser, userDataObj, setuserDataObj, loading } = useAuth()
    const [data, setData] = useState({})
    const now = new Date()


    async function handleSetMood(mood) {
        try {
            const day = now.getDate()
            const month = now.getMonth()
            const year = now.getFullYear()

            const newData = { ...userDataObj }

            // Ensure the structure exists for year, month, and day
            if (!newData[year]) {
                newData[year] = {}
            }
            if (!newData[year][month]) {
                newData[year][month] = {}
            }

            // Update the mood for today
            newData[year][month][day] = mood

            setData(newData) // Update local state

            setuserDataObj(newData) // Update user data object

            const docRef = doc(db, 'users', currentUser.uid)
            await setDoc(docRef, newData, { merge: true }) // Merge the entire newData object
        } catch (error) {
            console.log(error)
        }
    }


    function countValues() {
        let total_number_of_days = 0
        let sum_moods = 0
        for (let year in data) {
            for (let month in data[year]) {
                for (let day in data[year][month]) {
                    let days_mood = data[year][month][day];
                    total_number_of_days++
                    sum_moods += days_mood
                }
            }
        }
        return { num_day: total_number_of_days, Average_mood:( sum_moods / total_number_of_days )}
    }

    const statuses = {
        ...countValues(),
        time_remaining: `${23 - now.getHours()}H ${60 - now.getMinutes()}M`,
    }
    const moods = {
        "@#$@%": '😭',
        'Sad': '😢',
        'Existing': '😑',
        'Good': '😊',
        'Elated': '😆',
    }



    useEffect(() => {
        if (!currentUser || !userDataObj) {
            return
        }
        setData(userDataObj)
    }, [currentUser, userDataObj])


    let children;

    if (loading) {
        children = <Loading />;
    } else if (!currentUser) {
        children = <Login />;
    } else {
        children = (
            <div className='flex flex-col flex-1 gap-8 sm:gap-12 md:gap-16'>
                <div className='grid grid-cols-3 bg-indigo-50 text-indigo-500 rounded-lg p-4 gap-4'>
                    {Object.keys(statuses).map((Status, StatusIndex) => {
                        return (
                            <div key={StatusIndex} className='flex flex-col gap-1 sm:gap-2'>
                                <p className='truncate capitalize font-medium text-xs sm:text-sm'>{Status.replaceAll('_', " ")}</p>
                                <p className={'text-base truncate ' + fugaz.className}>{statuses[Status]}</p>
                            </div>
                        )
                    })}
                </div>
                <h4 className={'text-5xl sm:text-6xl md:text-7xl text-center ' + fugaz.className}>
                    How do you <span className='text-gradient'>feel</span> today?
                </h4>
                <div className='flex items-stretch flex-wrap gap-4'>
                    {Object.keys(moods).map((mood, moodIndex) => {
                        return (
                            <button onClick={() => {
                                const currentMoodValue = moodIndex + 1;
                                handleSetMood(currentMoodValue);
                            }}
                                className={'p-4 px-5 rounded-2xl purple-shadow duration-200 bg-indigo-50 hover:bg-indigo-200 text-center flex items-center flex-col gap-2 flex-1'} key={moodIndex}>
                                <p className='text-4xl sm:text-5xl md:text-6xl'>{moods[mood]}</p>
                                <p className={'text-indigo-500 text-xs sm:text-sm md:text-base ' + fugaz.className}>{mood}</p>
                            </button>
                        )
                    })}
                </div>
                <Calender campleteData={data} handleSetMood={handleSetMood} />
                
            </div>
        );
    }

    return children;
}
