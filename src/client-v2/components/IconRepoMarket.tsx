import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Popconfirm,
  message,
  Tooltip,
  Alert,
  Input,
  Radio,
  Spin,
  Divider,
  Empty,
  Modal,
  Progress,
  InputNumber,
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  CloudDownloadOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  CompassOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ForwardOutlined,
} from '@ant-design/icons';
import { customIconsManager } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg } from '../utils/svg-helper';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 创造狮草莓图标的本地真实高保真矢量预览映射
const REAL_CAOMEI_PREVIEWS: Record<string, string> = {
  'czs-home': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M128 512v448h288v-256h192v256h288v-448l-384-320z" fill="currentColor" /><path d="M512 57.6l-448 371.2v83.2l448-371.2 448 371.2v-83.2z" fill="currentColor" /></svg>',
  'czs-setting': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1011.2 422.4c-19.2 6.4-32 6.4-51.2 6.4-51.2 0-102.4-25.6-134.4-76.8-38.4-64-19.2-147.2 32-192-51.2-51.2-121.6-89.6-192-115.2-12.8 70.4-76.8 128-153.6 128-70.4 0-134.4-57.6-147.2-128-70.4 19.2-140.8 57.6-198.4 108.8 64 44.8 83.2 134.4 38.4 198.4-25.6 51.2-76.8 76.8-128 76.8-19.2 0-44.8-6.4-64-12.8-6.4 38.4-12.8 76.8-12.8 115.2s6.4 76.8 12.8 115.2c19.2-6.4 44.8-12.8 64-12.8 51.2 0 102.4 25.6 134.4 76.8 38.4 70.4 19.2 153.6-38.4 198.4 51.2 51.2 121.6 96 192 115.2 12.8-76.8 76.8-134.4 153.6-134.4s140.8 57.6 153.6 128c70.4-25.6 140.8-64 192-115.2-57.6-44.8-70.4-128-32-192 25.6-51.2 83.2-76.8 134.4-76.8 19.2 0 32 0 51.2 6.4 0-32 6.4-70.4 6.4-108.8s-6.4-76.8-12.8-108.8zM640 537.6c0 70.4-57.6 128-128 128s-128-57.6-128-128c0-70.4 57.6-128 128-128s128 57.6 128 128z" fill="currentColor" /></svg>',
  'czs-user': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M768 320c0 141.385-114.615 256-256 256s-256-114.615-256-256c0-141.385 114.615-256 256-256s256 114.615 256 256z" fill="currentColor" /><path d="M512 576c-224 0-409.6 166.4-441.6 384h883.2c-32-217.6-217.6-384-441.6-384z" fill="currentColor" /></svg>',
  'czs-heart': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M928 185.6c-44.8-51.2-108.8-76.8-179.2-76.8-64 0-128 25.6-179.2 76.8l-57.6 57.6-57.6-64c-51.2-44.8-115.2-70.4-179.2-70.4s-128 25.6-179.2 76.8c-96 96-96 262.4 0 358.4l416 416 416-416c96-96 96-262.4 0-358.4z" fill="currentColor" /></svg>',
  'czs-star': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 0l160 320 352 51.2-256 249.6 57.6 352-313.6-166.4-313.6 166.4 57.6-352-256-249.6 352-51.2z" fill="currentColor" /></svg>',
  'czs-shield': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M755.2 83.2c-153.6-51.2-326.4-51.2-480 0l-147.2 44.8v512l384 384 384-384v-512l-140.8-44.8zM832 620.8l-320 320-320-320v-422.4l121.6-38.4c64-19.2 134.4-32 198.4-32s134.4 12.8 198.4 32l121.6 38.4v422.4z" fill="currentColor" /><path d="M512 185.6c-64 0-121.6 12.8-179.2 32l-76.8 25.6v352l256 256 256-256v-352l-76.8-25.6c-57.6-19.2-115.2-32-179.2-32zM460.8 576l-140.8-140.8 44.8-44.8 96 96 224-230.4 44.8 44.8-268.8 275.2z" fill="currentColor" /></svg>',
  'czs-camera': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M384 192v-64h-256v64h-64v704h896v-704h-576zM416 768c-121.6 0-224-102.4-224-224s102.4-224 224-224 224 102.4 224 224-102.4 224-224 224zM832 384h-192v-64h192v64z" fill="currentColor" /><path d="M416 384c-89.6 0-160 70.4-160 160s70.4 160 160 160 160-70.4 160-160c0-89.6-70.4-160-160-160zM416 640c-51.2 0-96-44.8-96-96s44.8-96 96-96c51.2 0 96 44.8 96 96s-44.8 96-96 96z" fill="currentColor" /></svg>',
  'czs-cloud': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M800 377.6c6.4-166.4-128-294.4-288-294.4s-294.4 128-294.4 294.4c-121.6 0-217.6 96-217.6 217.6s96 217.6 217.6 217.6h582.4c121.6 0 217.6-96 217.6-217.6s-96-217.6-217.6-217.6z" fill="currentColor" /></svg>',
  'czs-airplane': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M864 384h-275.2l-204.8-256h-64l51.2 256h-179.2l-128-128v448l128-128h192l-64 256h64l256-256h224c51.2 0 96-44.8 96-96s-44.8-96-96-96z" fill="currentColor" /></svg>',
  'czs-folder': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 256l-128-128h-320v768h896v-640z" fill="currentColor" /></svg>',
  'czs-about': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64c-249.6 0-448 198.4-448 448s198.4 448 448 448 448-198.4 448-448c0-249.6-198.4-448-448-448zM544 768h-64v-64h64v64zM544 640h-64v-384h64v384z" fill="currentColor" /></svg>',
  'czs-alipay': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1024 704v-505.6c0-108.8-89.6-198.4-198.4-198.4h-627.2c-108.8 0-198.4 89.6-198.4 198.4v627.2c0 108.8 89.6 198.4 198.4 198.4h627.2c96 0 179.2-70.4 192-160-51.2-25.6-281.6-121.6-396.8-179.2-89.6 108.8-185.6 172.8-326.4 172.8s-236.8-89.6-224-192c12.8-70.4 57.6-185.6 268.8-166.4 108.8 12.8 160 32 249.6 64 25.6-44.8 44.8-89.6 57.6-140.8h-396.8v-38.4h198.4v-70.4h-243.2v-44.8h243.2v-102.4c0 0 0-19.2 19.2-19.2h96v115.2h256v44.8h-256v76.8h211.2c-19.2 76.8-51.2 147.2-83.2 211.2 57.6 19.2 332.8 108.8 332.8 108.8zM281.6 793.6c-147.2 0-172.8-96-166.4-134.4 12.8-38.4 51.2-89.6 134.4-89.6 96 0 179.2 25.6 281.6 76.8-64 89.6-153.6 147.2-249.6 147.2z" fill="currentColor" /></svg>',
  'czs-android': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M217.6 345.6h563.2v409.6c0 38.4-32 70.4-64 70.4h-44.8v134.4c0 32-25.6 64-64 64-32 0-64-25.6-64-64v-140.8h-89.6v140.8c0 32-25.6 64-64 64-32 0-64-25.6-64-64v-140.8h-44.8c-38.4 0-70.4-32-70.4-70.4l6.4-403.2zM128 332.8c-32 0-64 25.6-64 64v262.4c0 32 25.6 64 64 64s64-25.6 64-64v-262.4c0-38.4-32-64-64-64zM780.8 320h-569.6c0-96 57.6-185.6 147.2-224l-44.8-83.2c0-6.4 0-12.8 0-12.8 6.4 0 12.8 0 12.8 6.4l44.8 83.2c38.4-19.2 76.8-25.6 121.6-25.6s83.2 6.4 121.6 25.6l44.8-83.2c6.4-6.4 12.8-6.4 19.2-6.4s6.4 6.4 0 12.8l-38.4 83.2c83.2 44.8 140.8 128 140.8 224zM390.4 192c0-12.8-12.8-25.6-25.6-25.6-12.8 6.4-19.2 12.8-19.2 25.6s12.8 25.6 25.6 25.6c12.8 0 19.2-12.8 19.2-25.6zM652.8 192c0-12.8-12.8-25.6-25.6-25.6-12.8 6.4-25.6 12.8-25.6 25.6s12.8 25.6 25.6 25.6c12.8 0 25.6-12.8 25.6-25.6zM870.4 332.8c-32 0-64 25.6-64 64v262.4c0 32 25.6 64 64 64 32 0 64-25.6 64-64v-262.4c-6.4-38.4-32-64-64-64z" fill="currentColor" /></svg>',
  'czs-apple': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M844.8 672c-25.6-38.4-44.8-89.6-44.8-134.4s12.8-89.6 38.4-128c12.8-19.2 38.4-44.8 70.4-70.4-19.2-25.6-44.8-44.8-64-64-38.4-25.6-83.2-38.4-128-38.4-32 0-64 6.4-108.8 19.2-38.4 12.8-64 19.2-83.2 19.2-12.8 0-44.8-6.4-83.2-19.2-44.8-12.8-83.2-19.2-108.8-19.2-70.4 0-128 32-172.8 89.6-51.2 57.6-76.8 134.4-76.8 230.4 0 102.4 32 204.8 89.6 307.2 64 108.8 121.6 160 185.6 160 19.2 0 44.8-6.4 83.2-19.2 32-12.8 64-19.2 89.6-19.2s57.6 6.4 96 19.2c38.4 12.8 64 19.2 83.2 19.2 51.2 0 102.4-38.4 160-121.6 38.4-51.2 57.6-102.4 76.8-153.6-38.4-12.8-70.4-38.4-102.4-76.8z" fill="currentColor" /><path d="M633.6 192c25.6-25.6 44.8-51.2 57.6-83.2s19.2-57.6 19.2-83.2c0-6.4 0-6.4 0-12.8s0-6.4 0-12.8c-76.8 19.2-128 44.8-153.6 89.6-32 44.8-51.2 96-51.2 160 32 0 51.2-6.4 64-12.8 19.2-6.4 44.8-19.2 64-44.8z" fill="currentColor" /></svg>',
  'czs-chrome': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M256 448l-147.2-256c96-115.2 243.2-192 403.2-192 185.6 0 352 102.4 441.6 249.6h-416c-6.4 0-12.8 0-25.6 0-121.6 0-224 83.2-256 198.4v0zM697.6 326.4h294.4c19.2 57.6 32 121.6 32 185.6 0 281.6-224 512-505.6 512l211.2-364.8c32-44.8 44.8-96 44.8-147.2 0-70.4-32-140.8-76.8-185.6v0zM326.4 512c0-102.4 83.2-185.6 185.6-185.6s185.6 83.2 185.6 185.6-83.2 185.6-185.6 185.6-185.6-83.2-185.6-185.6zM582.4 761.6l-147.2 256c-243.2-38.4-435.2-249.6-435.2-505.6 0-89.6 25.6-179.2 64-249.6l211.2 364.8c44.8 89.6 134.4 153.6 236.8 153.6 25.6-6.4 44.8-12.8 70.4-19.2z" fill="currentColor" /></svg>',
  'czs-code-branch': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M832 320c0-70.4-57.6-128-128-128s-128 57.6-128 128c0 44.8 25.6 83.2 57.6 108.8-19.2 57.6-64 108.8-134.4 121.6-44.8 0-83.2 19.2-115.2 38.4v-288c38.4-19.2 64-64 64-108.8 0-70.4-57.6-128-128-128s-128 57.6-128 128c0 44.8 25.6 89.6 64 108.8v422.4c-38.4 19.2-64 64-64 108.8 0 70.4 57.6 128 128 128s128-57.6 128-128c0-32-12.8-64-38.4-89.6 25.6-38.4 64-64 115.2-70.4 121.6-19.2 217.6-115.2 236.8-236.8 44.8-25.6 70.4-64 70.4-115.2zM320 128c38.4 0 64 25.6 64 64s-25.6 64-64 64-64-25.6-64-64 25.6-64 64-64zM320 896c-38.4 0-64-25.6-64-64s25.6-64 64-64 64 25.6 64 64-25.6 64-64 64zM704 384c-38.4 0-64-25.6-64-64s25.6-64 64-64 64 25.6 64 64-25.6 64-64 64z" fill="currentColor" /></svg>',
  'czs-cup': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M0 832h832v64h-832v-64z" fill="currentColor" /><path d="M864 256h-96v-64h-704v512c0 38.4 25.6 64 64 64h576c38.4 0 64-25.6 64-64v-128h96c89.6 0 160-70.4 160-160s-70.4-160-160-160zM192 576h-64v-320h64v320zM864 512h-96v-192h96c51.2 0 96 44.8 96 96s-44.8 96-96 96z" fill="currentColor" /></svg>',
  'czs-dashboard': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 128c-249.6 0-448 198.4-448 448 0 70.4 12.8 134.4 44.8 192h806.4c25.6-57.6 44.8-121.6 44.8-192 0-249.6-198.4-448-448-448zM768 608v-64h64v64h-64zM716.8 416l-44.8-44.8 44.8-44.8 44.8 44.8-44.8 44.8zM256 544v64h-64v-64h64zM307.2 416l-44.8-44.8 44.8-44.8 44.8 44.8-44.8 44.8zM480 320v-64h64v64h-64zM448 704l64-320 64 320h-128z" fill="currentColor" /></svg>',
  'czs-github': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M915.2 326.4c6.4-19.2 32-96-6.4-198.4 0 0-64-19.2-204.8 76.8-64-12.8-128-19.2-192-19.2s-128 6.4-185.6 19.2c-147.2-96-211.2-76.8-211.2-76.8-38.4 102.4-12.8 179.2-6.4 198.4-44.8 51.2-76.8 121.6-76.8 204.8 0 307.2 198.4 377.6 480 377.6s480-70.4 480-377.6c0-83.2-32-153.6-76.8-204.8zM512 851.2c-198.4 0-358.4-6.4-358.4-198.4 0-44.8 25.6-89.6 64-121.6 64-57.6 172.8-25.6 300.8-25.6 121.6 0 230.4-32 294.4 25.6 38.4 38.4 64 76.8 64 121.6-6.4 185.6-166.4 198.4-364.8 198.4zM358.4 550.4c-38.4 0-70.4 51.2-70.4 108.8s32 108.8 70.4 108.8 70.4-51.2 70.4-108.8-25.6-108.8-70.4-108.8zM665.6 550.4c-38.4 0-70.4 44.8-70.4 108.8s32 108.8 70.4 108.8c38.4 0 70.4-51.2 70.4-108.8s-32-108.8-70.4-108.8z" fill="currentColor" /></svg>',
};

// Iconmonstr 官方经典黑白矢量预览映射
const REAL_ICONMONSTR_PREVIEWS: Record<string, string> = {
  'quote-right-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m2.699 20c-.411 0-.699-.312-.699-.662 0-.249.145-.516.497-.703 1.788-.947 3.858-4.226 3.858-6.248-3.016.092-4.326-2.582-4.326-4.258 0-2.006 1.738-4.129 4.308-4.129 3.241 0 4.83 2.547 4.83 5.307 0 5.981-6.834 10.693-8.468 10.693zm10.833 0c-.41 0-.699-.312-.699-.662 0-.249.145-.516.497-.703 1.788-.947 3.858-4.226 3.858-6.248-3.015.092-4.326-2.582-4.326-4.258 0-2.006 1.739-4.129 4.308-4.129 3.241 0 4.83 2.547 4.83 5.307 0 5.981-6.833 10.693-8.468 10.693z" fill-rule="nonzero"/></svg>',
  'quote-left-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m21.301 4c.411 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.738 4.129-4.308 4.129-3.24 0-4.83-2.547-4.83-5.307 0-5.98 6.834-10.693 8.468-10.693zm-10.833 0c.41 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.739 4.129-4.308 4.129-3.241 0-4.83-2.547-4.83-5.307 0-5.98 6.833-10.693 8.468-10.693z" fill-rule="nonzero"/></svg>',
  'layer-multiple-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22 8c0-.478-.379-1-1-1h-13c-.62 0-1 .519-1 1v13c0 .621.52 1 1 1h13c.478 0 1-.379 1-1zm-16-2h13.25c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-13.75c-.53 0-1 .47-1 1v13.75c0 .414.336.75.75.75s.75-.336.75-.75zm-2.5-2.5h13.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-14.25c-.53 0-1 .47-1 1v14.25c0 .414.336.75.75.75s.75-.336.75-.75z" fill-rule="nonzero"/></svg>',
  'copy-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m16.5 11.5v11.5h-15.5v-15.5h11.5zm-1 1h-13.5v13.5h13.5zm7.5-11.5v14.5h-1v-13.5h-13.5v-1z" fill-rule="nonzero"/></svg>',
  'pencil-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m19.5 0c1.378 0 2.5 1.122 2.5 2.5 0 .666-.264 1.305-.732 1.774l-14.768 14.726h-4.5v-4.5l14.726-14.768c.469-.468 1.108-.732 1.774-.732zm-12.793 18.001 13.526-13.526c.211-.211.33-.497.33-.794 0-.62-.505-1.125-1.125-1.125-.297 0-.583.119-.794.33l-13.526 13.526zm-3.707.999v1h1l10.999-10.999-1-1z" fill-rule="nonzero"/></svg>',
  'heart-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12 5.72c-2.624-4.517-10-3.198-10 2.461 0 3.725 4.345 7.727 9.303 12.54.194.189.446.283.697.283s.503-.094.697-.283c4.977-4.831 9.303-8.814 9.303-12.54 0-5.678-7.396-6.944-10-2.461z" fill-rule="nonzero"/></svg>',
  'save-lined': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23 4.5v18.5h-22v-22h14.5zm-21 17.5h20v-16.897l-3.603-3.603h-16.397zm3-15h14v2h-14zm0 4h14v2h-14zm0 4h14v2h-14z" fill-rule="nonzero"/></svg>',
  'magnifier-lined': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m15.97 17.031c-1.479 1.238-3.384 1.985-5.461 1.985-4.697 0-8.509-3.812-8.509-8.508s3.812-8.508 8.509-8.508 8.508 3.812 8.508 8.508c0 2.078-.747 3.984-1.985 5.461l4.977 4.977c.293.293.293.767 0 1.06-.293.293-.768.293-1.061 0zm-5.461-13.539c-3.867 0-7.008 3.141-7.008 7.008s3.141 7.008 7.008 7.008 7.008-3.141 7.008-7.008-3.141-7.008-7.008-7.008z" fill-rule="nonzero"/></svg>',
};

export interface IconRepoItem {
  key: string;
  title: string;
  category: string;
  version: string;
  homepage: string;
  description: string;
  downloadUrl?: string;
  sourceType: 'zip' | 'iconify' | 'iconmonstr';
  prefix?: string;
  iconCount: number;
  tags?: string[];
  status: 'installed' | 'not_installed' | 'installing';
  installedCount?: number;
  installedAt?: string;
  previewIcons: string[];
}

interface ProbeResult {
  prefix: string;
  title: string;
  total: number;
  author: string;
  license: string;
  category: string;
  samples: string[];
  homepage: string;
  sourcePlatform?: string;
}

interface IconRepoMarketProps {
  apiClient: any;
  onRepoChanged?: () => void;
}

export const IconRepoMarket: React.FC<IconRepoMarketProps> = ({ apiClient, onRepoChanged }) => {
  const [repos, setRepos] = useState<IconRepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [operatingKey, setOperatingKey] = useState<string | null>(null);

  // 搜索与标签筛选
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Iconify 自定义输入探测
  const [customInput, setCustomInput] = useState<string>('');
  const [probing, setProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);

  // Iconmonstr 分页面全量实时拉取控制状态
  const [crawlModalVisible, setCrawlModalVisible] = useState<boolean>(false);
  const [crawlStartPage, setCrawlStartPage] = useState<number>(1);
  const [crawlEndPage, setCrawlEndPage] = useState<number>(80);
  const [crawlRunning, setCrawlRunning] = useState<boolean>(false);
  const [crawlCurrentPage, setCrawlCurrentPage] = useState<number>(1);
  const [crawlTotalInstalled, setCrawlTotalInstalled] = useState<number>(0);
  const [crawlLogText, setCrawlLogText] = useState<string>('');
  const stopCrawlRef = React.useRef<boolean>(false);

  const fetchRepos = async () => {
    if (!apiClient) return;
    setLoading(true);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({ url: 'customIconRepos:list' });
      } catch (e) {
        res = await apiClient.request({ url: 'custom_icon_repos:list' });
      }
      setRepos(res?.data?.data || res?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch icon repos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // 执行 Iconify 官方平台探测
  const handleProbe = async () => {
    if (!customInput.trim()) {
      message.warning('请输入 Iconify 图标集前缀或链接，例如：solar 或 https://icon-sets.iconify.design/solar/');
      return;
    }
    setProbing(true);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:probe',
          params: { prefix: customInput.trim() },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:probe',
          params: { prefix: customInput.trim() },
        });
      }

      const data: ProbeResult = res?.data?.data || res?.data;
      if (data && data.title) {
        setProbeResult(data);
        message.success(`成功探测到 [${data.title}] 图标集，共 ${data.total} 款矢量图标！`);
      } else {
        message.error('未检索到有效的集合信息，请确认前缀名称是否正确');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '探测失败，请确认图标集前缀是否正确');
    } finally {
      setProbing(false);
    }
  };

  // 安装指定的仓库（预置或探测到的自定义库）
  const handleInstall = async (
    repoKey: string,
    title: string,
    categoryName?: string,
    iconCount?: number,
  ) => {
    if (repoKey === 'iconmonstr') {
      openIconmonstrCrawlModal(0);
      return;
    }
    setOperatingKey(repoKey);
    const hideMsg = message.loading(`正在从 Iconify / CDN 高速下载并解析 [${title}]，请稍候...`, 0);
    try {
      let res: any = null;
      const payload = {
        key: repoKey,
        title,
        category: categoryName || repoKey,
      };

      try {
        res = await apiClient.request({
          url: 'customIconRepos:install',
          method: 'post',
          data: payload,
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:install',
          method: 'post',
          data: payload,
        });
      }

      const result = res?.data?.data || res?.data || {};
      message.success(
        `恭喜！成功导入 [${title}]，共导入 ${result.total || iconCount || 0} 个矢量图标！已自动分类至 [${result.category || categoryName || repoKey}]`,
      );

      // 重新加载全局图标数据，让界面与选择器即时生效
      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();

      // 如果是自定义探测安装，清空探测结果
      if (probeResult && probeResult.prefix === repoKey) {
        setProbeResult(null);
        setCustomInput('');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '安装失败，请检查网络或稍后重试');
    } finally {
      hideMsg();
      setOperatingKey(null);
    }
  };

  // 打开 Iconmonstr 分页面抓取面板
  const openIconmonstrCrawlModal = (currentInstalledCount = 0) => {
    setCrawlTotalInstalled(currentInstalledCount);
    const estimatedNextPage = Math.min(80, Math.floor(currentInstalledCount / 60) + 1);
    setCrawlStartPage(estimatedNextPage);
    setCrawlCurrentPage(estimatedNextPage);
    setCrawlEndPage(80);
    setCrawlLogText(`就绪：准备从第 ${estimatedNextPage} 页爬取至第 80 页（当前本地已入库 ${currentInstalledCount} 款）\n`);
    setCrawlModalVisible(true);
  };

  // 开始执行分页面连续爬取
  const handleStartCrawl = async () => {
    if (crawlStartPage > crawlEndPage) {
      message.warning('起始页码不能大于结束页码');
      return;
    }
    setCrawlRunning(true);
    stopCrawlRef.current = false;
    let accumulated = crawlTotalInstalled;

    for (let p = crawlStartPage; p <= crawlEndPage; p++) {
      if (stopCrawlRef.current) {
        setCrawlLogText((prev) => `[已暂停] 任务已手动暂停，当前停留于第 ${p - 1} 页。\n` + prev);
        break;
      }
      setCrawlCurrentPage(p);
      setCrawlLogText((prev) => `[${new Date().toLocaleTimeString()}] 正在抓取第 ${p} / ${crawlEndPage} 页 (每页约60款，请稍候)...\n` + prev);
      try {
        let res: any = null;
        const reqData = { repoKey: 'iconmonstr', page: p, category: 'iconmonstr' };
        try {
          res = await apiClient.request({
            url: 'customIconRepos:crawlPage',
            method: 'post',
            data: reqData,
          });
        } catch (e) {
          res = await apiClient.request({
            url: 'custom_icon_repos:crawlPage',
            method: 'post',
            data: reqData,
          });
        }

        const resData = res?.data?.data || res?.data || {};
        accumulated = resData.totalInstalled || (accumulated + (resData.pageItemCount || 0));
        setCrawlTotalInstalled(accumulated);
        setCrawlLogText(
          (prev) =>
            `[${new Date().toLocaleTimeString()}] ✓ 第 ${p} 页完成！本页拉取: ${resData.pageItemCount || 0} 款，当前累计已入库: ${accumulated} 款\n` + prev,
        );

        if (resData.hasNextPage === false) {
          setCrawlLogText((prev) => `[${new Date().toLocaleTimeString()}] 🏁 已检测到官方末页，全量爬取完成！\n` + prev);
          break;
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        setCrawlLogText(
          (prev) => `[${new Date().toLocaleTimeString()}] ⚠ 第 ${p} 页请求出错: ${err?.response?.data?.message || err?.message}，继续下一页...\n` + prev,
        );
      }
    }

    setCrawlRunning(false);
    await customIconsManager.loadIcons(apiClient);
    await fetchRepos();
    if (onRepoChanged) onRepoChanged();
  };

  // 暂停爬取
  const handleStopCrawl = () => {
    stopCrawlRef.current = true;
    setCrawlRunning(false);
  };

  // 卸载已安装的仓库
  const handleUninstall = async (repoKey: string, title: string) => {
    setOperatingKey(repoKey);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:uninstall',
          method: 'post',
          data: { key: repoKey },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:uninstall',
          method: 'post',
          data: { key: repoKey },
        });
      }

      const result = res?.data?.data || res?.data || {};
      message.success(`[${title}] 已卸载，已清理 ${result.removedCount || 0} 个关联图标`);
      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();
    } catch (err: any) {
      message.error(err?.message || '卸载失败');
    } finally {
      setOperatingKey(null);
    }
  };

  // 渲染单个预览图标（本地已安装 SVG 优先，未安装则使用官方实时 CDN SVG）
  const renderSinglePreview = (
    prefix: string,
    iconName: string,
    isInstalled: boolean,
    sourceType?: string,
  ) => {
    const cleanName = iconName.includes(':') ? iconName.split(':')[1] : iconName;
    const fullName = `${prefix}:${cleanName}`;

    // 1. 本地已安装图标优先（无论来自草莓还是 Iconify）
    const localIcon = customIconsManager
      .getAllIcons()
      .find((i) => i.name === fullName || i.name === cleanName || i.name === iconName);

    if (localIcon?.svg) {
      return (
        <Tooltip title={localIcon.title ? `${localIcon.title} (${localIcon.name})` : localIcon.name} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 6,
              backgroundColor: '#fff',
              border: isInstalled ? '1px solid #b7eb8f' : '1px solid #e8e8e8',
              fontSize: 20,
              color: isInstalled ? '#52c41a' : '#1677ff',
              transition: 'all 0.2s',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localIcon.svg) }}
          />
        </Tooltip>
      );
    }

    // 2. 草莓库未安装或本地未命中的预设高保真矢量
    if (sourceType === 'zip' || prefix === 'caomei') {
      const localSvg = REAL_CAOMEI_PREVIEWS[iconName] || REAL_CAOMEI_PREVIEWS[cleanName] || '';
      if (localSvg) {
        return (
          <Tooltip title={iconName} key={iconName}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#fff',
                border: isInstalled ? '1px solid #b7eb8f' : '1px solid #e8e8e8',
                fontSize: 20,
                color: isInstalled ? '#52c41a' : '#1677ff',
                transition: 'all 0.2s',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localSvg) }}
            />
          </Tooltip>
        );
      }
      // 草莓库为国内开源独立库，不属于 Iconify 平台，若无 SVG 则使用精致文字徽标，不走 Iconify CDN 以免 404
      return (
        <Tooltip title={iconName} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 6,
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
              fontSize: 12,
              fontWeight: 600,
              color: '#8c8c8c',
            }}
          >
            {cleanName.slice(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      );
    }

    // 3. Iconmonstr 库未安装时的预设高保真黑白矢量预览
    if (sourceType === 'iconmonstr' || prefix === 'iconmonstr') {
      const localSvg = REAL_ICONMONSTR_PREVIEWS[iconName] || REAL_ICONMONSTR_PREVIEWS[cleanName] || '';
      if (localSvg) {
        return (
          <Tooltip title={iconName} key={iconName}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#fff',
                border: isInstalled ? '1px solid #b7eb8f' : '1px solid #e8e8e8',
                fontSize: 20,
                color: isInstalled ? '#52c41a' : '#262626',
                transition: 'all 0.2s',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localSvg) }}
            />
          </Tooltip>
        );
      }
      return (
        <Tooltip title={iconName} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 6,
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
              fontSize: 12,
              fontWeight: 600,
              color: '#595959',
            }}
          >
            {cleanName.slice(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      );
    }

    // 4. Iconify 官方在线实时 SVG 图（带错误自动兜底防裂图）
    const onlineSvgUrl = `https://api.iconify.design/${prefix}/${cleanName}.svg?color=%231677ff`;
    return (
      <Tooltip title={fullName} key={iconName}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 6,
            backgroundColor: '#fff',
            border: isInstalled ? '1px solid #b7eb8f' : '1px solid #e8e8e8',
            padding: 6,
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <img
            src={onlineSvgUrl}
            alt={fullName}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            loading="lazy"
            onError={(e) => {
              // 图片加载失败（如网络中断或 404）时隐藏自身，显示优雅文字徽标，彻底杜绝浏览器裂图
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-badge')) {
                const badge = document.createElement('span');
                badge.className = 'fallback-badge';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = '600';
                badge.style.color = '#bfbfbf';
                badge.innerText = cleanName.slice(0, 2).toUpperCase();
                parent.appendChild(badge);
              }
            }}
          />
        </div>
      </Tooltip>
    );
  };

  // 根据分类标签与搜索过滤
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      // 分类筛选
      if (activeCategoryFilter === 'installed' || activeCategoryFilter === '已安装') {
        const isInstalled = r.status === 'installed' || (r.installedCount && r.installedCount > 0);
        if (!isInstalled) return false;
      } else if (activeCategoryFilter !== 'all') {
        const tags = r.tags || [];
        if (!tags.includes(activeCategoryFilter)) return false;
      }

      // 关键词搜索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const inTitle = (r.title || '').toLowerCase().includes(kw);
        const inKey = (r.key || '').toLowerCase().includes(kw);
        const inDesc = (r.description || '').toLowerCase().includes(kw);
        const inCategory = (r.category || '').toLowerCase().includes(kw);
        return inTitle || inKey || inDesc || inCategory;
      }
      return true;
    });
  }, [repos, activeCategoryFilter, searchKeyword]);

  return (
    <div style={{ marginTop: 12 }}>
      {/* 顶部提示横幅 */}
      <Alert
        message="海量图标集支持与高可用持久化机制"
        description={
          <div>
            支持直连导入{' '}
            <a href="https://www.streamlinehq.com/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Streamline HQ (streamlinehq.com)
            </a>{' '}
            、{' '}
            <a href="https://iconmonstr.com/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Iconmonstr (iconmonstr.com)
            </a>{' '}
            与{' '}
            <a href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Iconify 官方图标集平台 (icon-sets.iconify.design)
            </a>{' '}
            的海量开源矢量图标（覆盖 150+ 主流图标库与 200,000+ 矢量图标）。所有已安装的图标均由系统核心数据库与本地文件双重持久化保存，系统升级或重启永久有效。
          </div>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      {/* 自定义 Streamline / Iconmonstr / Iconify 图标集快速导入面板 */}
      <Card
        style={{
          marginBottom: 20,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #f0f5ff 0%, #fafcff 100%)',
          borderColor: '#adc6ff',
        }}
        bodyStyle={{ padding: 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <Space>
            <CloudDownloadOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <Text strong style={{ fontSize: 15, color: '#1d39c4' }}>
              从 Streamline HQ、Iconmonstr 或 Iconify 平台直接导入任意图标集
            </Text>
            <Tag color="blue">实时探测与解析</Tag>
          </Space>
          <Space size={12}>
            <Button
              type="link"
              size="small"
              icon={<GlobalOutlined />}
              href="https://www.streamlinehq.com/"
              target="_blank"
              style={{ padding: 0 }}
            >
              StreamlineHQ 官网
            </Button>
            <Button
              type="link"
              size="small"
              icon={<GlobalOutlined />}
              href="https://iconmonstr.com/"
              target="_blank"
              style={{ padding: 0 }}
            >
              Iconmonstr 官网
            </Button>
            <Button
              type="link"
              size="small"
              icon={<GlobalOutlined />}
              href="https://icon-sets.iconify.design/"
              target="_blank"
              style={{ padding: 0 }}
            >
              Iconify 官网
            </Button>
          </Space>
        </div>

        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={18} lg={19}>
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onPressEnter={handleProbe}
              placeholder="输入前缀或链接，例如：streamline、iconmonstr、solar，或粘贴 https://iconmonstr.com/ 或 https://www.streamlinehq.com/"
              allowClear
              prefix={<CompassOutlined style={{ color: '#bfbfbf' }} />}
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col xs={24} md={6} lg={5}>
            <Button
              type="primary"
              icon={probing ? <SyncOutlined spin /> : <SearchOutlined />}
              onClick={handleProbe}
              loading={probing}
              size="large"
              block
              style={{ borderRadius: 6 }}
            >
              探测图标集
            </Button>
          </Col>
        </Row>

        {/* 探测成功后展示的集合预览卡片 */}
        {probeResult && (
          <Card
            style={{
              marginTop: 16,
              borderRadius: 6,
              backgroundColor: '#fff',
              borderColor: '#69b1ff',
              boxShadow: '0 2px 8px rgba(22, 119, 255, 0.08)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Title level={5} style={{ margin: 0, color: '#1677ff' }}>
                  {probeResult.title} ({probeResult.prefix})
                </Title>
                <Space size={8} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  <Tag color="cyan">{probeResult.total} 款矢量图标</Tag>
                  <Tag color="purple">作者: {probeResult.author}</Tag>
                  <Tag color="orange">开源协议: {probeResult.license}</Tag>
                  <Tag color="blue">自动分类: {probeResult.category}</Tag>
                </Space>
              </div>

              <Space>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  href={probeResult.homepage}
                  target="_blank"
                >
                  官方预览
                </Button>
                {probeResult.prefix === 'iconmonstr' ? (
                  <Button
                    type="primary"
                    icon={<CloudDownloadOutlined />}
                    onClick={() => openIconmonstrCrawlModal(0)}
                  >
                    分页面拉取所有页面
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={operatingKey === probeResult.prefix ? <SyncOutlined spin /> : <DownloadOutlined />}
                    loading={operatingKey === probeResult.prefix}
                    onClick={() =>
                      handleInstall(
                        probeResult.prefix,
                        probeResult.title,
                        probeResult.category,
                        probeResult.total,
                      )
                    }
                  >
                    确认导入并安装
                  </Button>
                )}
              </Space>
            </div>

            {probeResult.samples && probeResult.samples.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  典型图标预览（实时从官方抓取展示）：
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {probeResult.samples.slice(0, 12).map((sampleName) =>
                    renderSinglePreview(
                      probeResult.prefix,
                      sampleName,
                      false,
                      probeResult.sourcePlatform || 'iconify',
                    ),
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* 筛选与搜索工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Radio.Group
          value={activeCategoryFilter}
          onChange={(e) => setActiveCategoryFilter(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="all">
            <AppstoreOutlined /> 全部图标库
          </Radio.Button>
          <Radio.Button value="精选推荐">精选推荐</Radio.Button>
          <Radio.Button value="通用系统UI">通用系统UI</Radio.Button>
          <Radio.Button value="StreamlineHQ">Streamline HQ</Radio.Button>
          <Radio.Button value="Iconmonstr">Iconmonstr</Radio.Button>
          <Radio.Button value="品牌Logo">品牌 Logo</Radio.Button>
          <Radio.Button value="已安装">已安装</Radio.Button>
        </Radio.Group>

        <Search
          placeholder="按名称、前缀或分类过滤..."
          allowClear
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {/* 图标库卡片网格 */}
      <Spin spinning={loading}>
        {filteredRepos.length === 0 ? (
          <Empty
            style={{ margin: '48px 0' }}
            description={
              activeCategoryFilter === 'installed' || activeCategoryFilter === '已安装'
                ? '暂无已安装的图标库，可在上方「精选推荐」或「全部图标库」中一键安装'
                : '没有找到匹配的图标库'
            }
          />
        ) : (
          <Row gutter={[20, 20]}>
          {filteredRepos.map((repo) => {
            const isInstalled =
              repo.status === 'installed' || (repo.installedCount && repo.installedCount > 0);
            const isOperating = operatingKey === repo.key;

            return (
              <Col xs={24} sm={24} md={12} lg={12} key={repo.key}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 8,
                    borderColor: isInstalled ? '#b7eb8f' : '#e8e8e8',
                    boxShadow: isInstalled ? '0 2px 8px rgba(82, 196, 26, 0.12)' : undefined,
                    transition: 'all 0.3s',
                  }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <Title
                        level={5}
                        style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <ShoppingOutlined style={{ color: '#1677ff' }} />
                        {repo.title}
                        {repo.prefix && <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>({repo.prefix})</Text>}
                      </Title>
                      <Space size={6} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                        <Tag color="blue">v{repo.version}</Tag>
                        <Tag color="cyan">{repo.iconCount} 款图标</Tag>
                        <Tag color="geekblue">分类: {repo.category}</Tag>
                        {(repo.tags || []).map((t) => (
                          <Tag
                            key={t}
                            color={
                              t === 'StreamlineHQ'
                                ? 'purple'
                                : t === 'Iconmonstr'
                                ? 'volcano'
                                : t === '精选推荐'
                                ? 'gold'
                                : t === '品牌Logo'
                                ? 'magenta'
                                : undefined
                            }
                          >
                            {t}
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {isInstalled ? (
                      <Space size={6} style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}
                        >
                          已安装 ({repo.installedCount || repo.iconCount})
                        </Tag>
                        {repo.installedCount && repo.iconCount && repo.installedCount < repo.iconCount ? (
                          <Tag color="warning" style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}>
                            可扩容至 {repo.iconCount} 款
                          </Tag>
                        ) : null}
                      </Space>
                    ) : (
                      <Tag color="default" style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}>
                        未安装
                      </Tag>
                    )}
                  </div>

                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 13, marginBottom: 14, minHeight: 38 }}
                  >
                    {repo.description}
                  </Paragraph>

                  {/* 图标展示区 */}
                  <div
                    style={{
                      backgroundColor: '#fafafa',
                      padding: '12px 14px',
                      borderRadius: 6,
                      marginBottom: 16,
                      border: '1px dashed #e8e8e8',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>典型图标展示：</span>
                      <span>{isInstalled ? '本地已加载' : '官方在线实时预览'}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {(repo.previewIcons || []).map((iconName) =>
                        renderSinglePreview(
                          repo.prefix || repo.key,
                          iconName,
                          Boolean(isInstalled),
                          repo.sourceType,
                        ),
                      )}
                    </div>
                  </div>

                  {/* 底部操作工具栏 */}
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      href={repo.homepage}
                      target="_blank"
                      style={{ padding: 0 }}
                    >
                      访问主页
                    </Button>

                    <Space>
                      {repo.key === 'iconmonstr' ? (
                        <>
                          <Button
                            type="primary"
                            icon={<CloudDownloadOutlined />}
                            onClick={() => openIconmonstrCrawlModal(repo.installedCount || 0)}
                          >
                            {isInstalled ? '分页面拉取更多页面' : '分页面拉取所有页面'}
                          </Button>
                          {isInstalled ? (
                            <Popconfirm
                              title={`确认卸载 [${repo.title}]？`}
                              description="卸载后将清空已导入的该库图标（不影响用户手动上传的图标）。"
                              okText="卸载"
                              cancelText="取消"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => handleUninstall(repo.key, repo.title)}
                            >
                              <Button danger icon={<DeleteOutlined />} loading={isOperating}>
                                一键卸载
                              </Button>
                            </Popconfirm>
                          ) : null}
                        </>
                      ) : isInstalled ? (
                        <>
                          {repo.installedCount && repo.iconCount && repo.installedCount < repo.iconCount ? (
                            <Button
                              type="primary"
                              icon={<CloudDownloadOutlined />}
                              loading={isOperating}
                              onClick={() =>
                                handleInstall(repo.key, repo.title, repo.category, repo.iconCount)
                              }
                            >
                              扩容更新 ({repo.installedCount} → {repo.iconCount})
                            </Button>
                          ) : null}
                          <Popconfirm
                            title={`确认卸载 [${repo.title}]？`}
                            description="卸载后将清空已导入的该库图标（不影响用户手动上传的图标）。"
                            okText="卸载"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUninstall(repo.key, repo.title)}
                          >
                            <Button danger icon={<DeleteOutlined />} loading={isOperating}>
                              一键卸载
                            </Button>
                          </Popconfirm>
                        </>
                      ) : (
                        <Button
                          type="primary"
                          icon={isOperating ? <SyncOutlined spin /> : <DownloadOutlined />}
                          loading={isOperating}
                          onClick={() =>
                            handleInstall(repo.key, repo.title, repo.category, repo.iconCount)
                          }
                        >
                          一键下载安装
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        )}
      </Spin>

      {/* Iconmonstr 分页面全量实时拉取进度弹窗 */}
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span>Iconmonstr 官方图标库 · 分页面实时拉取</span>
          </Space>
        }
        open={crawlModalVisible}
        onCancel={() => {
          if (crawlRunning) {
            handleStopCrawl();
          }
          setCrawlModalVisible(false);
        }}
        footer={null}
        width={680}
        destroyOnClose={false}
      >
        <div style={{ marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="分页面在线爬取机制"
            description="Iconmonstr 官方全站约 4,784 款矢量图标分布于 80 页。系统采用单页原子爬取（每页约 60 款，耗时约 10 秒），绝不超时，支持随时暂停、断点续传。"
            style={{ marginBottom: 16 }}
          />

          {/* 页码与预设档位 */}
          <div
            style={{
              background: '#fafafa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <Text strong>快捷拉取档位：</Text>
              <Space wrap>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(1);
                  }}
                >
                  精选 1 页 (60款)
                </Button>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(5);
                  }}
                >
                  前 5 页 (~300款)
                </Button>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(20);
                  }}
                >
                  前 20 页 (~1,200款)
                </Button>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(80);
                  }}
                >
                  全量 80 页 (~4,784款)
                </Button>
              </Space>
            </div>

            <Row gutter={16} align="middle">
              <Col span={12}>
                <Space align="center">
                  <Text type="secondary">起始页码：</Text>
                  <InputNumber
                    min={1}
                    max={80}
                    value={crawlStartPage}
                    disabled={crawlRunning}
                    onChange={(val) => setCrawlStartPage(val || 1)}
                  />
                </Space>
              </Col>
              <Col span={12}>
                <Space align="center">
                  <Text type="secondary">结束页码：</Text>
                  <InputNumber
                    min={1}
                    max={80}
                    value={crawlEndPage}
                    disabled={crawlRunning}
                    onChange={(val) => setCrawlEndPage(val || 80)}
                  />
                  <Text type="secondary">(官网共 80 页)</Text>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 进度条与实时状态 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text strong>
                {crawlRunning
                  ? `正在抓取第 ${crawlCurrentPage} / ${crawlEndPage} 页...`
                  : `准备抓取第 ${crawlStartPage} 至 ${crawlEndPage} 页`}
              </Text>
              <Text type="secondary">
                数据库累计入库：<Text strong style={{ color: '#52c41a' }}>{crawlTotalInstalled}</Text> 款图标
              </Text>
            </div>
            <Progress
              percent={
                crawlEndPage >= crawlStartPage
                  ? Math.min(
                      100,
                      Math.round(
                        ((Math.max(crawlStartPage, crawlCurrentPage) - crawlStartPage + (crawlRunning ? 0.5 : 1)) /
                          (crawlEndPage - crawlStartPage + 1)) *
                          100,
                      ),
                    )
                  : 0
              }
              status={crawlRunning ? 'active' : 'normal'}
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
            />
          </div>

          {/* 实时控制台输出 */}
          <div style={{ marginBottom: 18 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              实时抓取日志：
            </Text>
            <Input.TextArea
              value={crawlLogText}
              readOnly
              rows={5}
              style={{
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
              }}
            />
          </div>

          {/* 底部控制按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {crawlRunning ? (
              <Button danger icon={<PauseCircleOutlined />} onClick={handleStopCrawl}>
                暂停抓取
              </Button>
            ) : (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartCrawl}>
                {crawlLogText.includes('已手动暂停') ? '继续抓取' : '开始分页面实时抓取'}
              </Button>
            )}
            <Button
              onClick={() => {
                if (crawlRunning) handleStopCrawl();
                setCrawlModalVisible(false);
              }}
            >
              {crawlRunning ? '中止并关闭' : '关闭'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default IconRepoMarket;
