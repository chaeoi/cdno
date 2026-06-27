#!/usr/bin/env bash


_red() {
    printf '\033[1;31m%b\033[0m' "$1"
}

_green() {
    printf '\033[1;32m%b\033[0m' "$1"
}

_yellow() {
    printf '\033[1;33m%b\033[0m' "$1"
}

_info() {
    _green "[Info] "
    printf -- "%s" "$1"
    printf "\n"
}

_warn() {
    _yellow "[Warning] "
    printf -- "%s" "$1"
    printf "\n"
}

_error() {
    _red "[Error] "
    printf -- "%s" "$1"
    printf "\n"
    exit 1
}

_version_ge(){
    test "$(echo "$@" | tr " " "\n" | sort -rV | head -n 1)" == "$1"
}

get_char() {
    SAVEDSTTY=`stty -g`
    stty -echo
    stty cbreak
    dd if=/dev/tty bs=1 count=1 2> /dev/null
    stty -raw
    stty echo
    stty $SAVEDSTTY
}

check_bbr_status() {
    local param=$(sysctl net.ipv4.tcp_congestion_control | awk '{print $3}')
    if [[ x"${param}" == x"bbr" ]]; then
        return 0
    else
        return 1
    fi
}

check_kernel_version() {
    local kernel_version=$(uname -r | cut -d- -f1)
    if _version_ge ${kernel_version} 4.9; then
        return 0
    else
        return 1
    fi
}

check_bbr_available() {
    local available=$(sysctl net.ipv4.tcp_available_congestion_control 2>/dev/null | awk -F'=' '{print $2}')
    if echo "${available}" | grep -qw "bbr"; then
        return 0
    fi
    # Try to load the bbr module, then check again.
    modprobe tcp_bbr 2>/dev/null
    available=$(sysctl net.ipv4.tcp_available_congestion_control 2>/dev/null | awk -F'=' '{print $2}')
    if echo "${available}" | grep -qw "bbr"; then
        return 0
    else
        return 1
    fi
}

sysctl_config() {
    sed -i '/net.core.default_qdisc/d' /etc/sysctl.conf
    sed -i '/net.ipv4.tcp_congestion_control/d' /etc/sysctl.conf
    echo "net.core.default_qdisc = fq" >> /etc/sysctl.conf
    echo "net.ipv4.tcp_congestion_control = bbr" >> /etc/sysctl.conf
    sysctl -p >/dev/null 2>&1
}

install_bbr() {
    if check_bbr_status; then
        echo
        _info "TCP BBR has already been enabled. nothing to do..."
        return 0
    fi
    if ! check_kernel_version; then
        _error "The current kernel ($(uname -r)) is older than 4.9 and does not support BBR. Please upgrade the kernel manually."
    fi
    if ! check_bbr_available; then
        _error "The current kernel does not provide the BBR module (tcp_bbr). Please use a kernel with BBR support."
    fi
    _info "Kernel supports BBR, enabling TCP BBR..."
    sysctl_config
    if check_bbr_status; then
        _info "Setting TCP BBR completed..."
    else
        _error "Failed to enable TCP BBR, please check the system configuration."
    fi
}

[[ $EUID -ne 0 ]] && _error "This script must be run as root"

opsy=$( [ -f /etc/os-release ] && . /etc/os-release && echo "${PRETTY_NAME}" )
arch=$( uname -m )
lbit=$( getconf LONG_BIT )
kern=$( uname -r )

clear
echo "---------- System Information ----------"
echo " OS      : $opsy"
echo " Arch    : $arch ($lbit Bit)"
echo " Kernel  : $kern"
echo "----------------------------------------"
echo " Automatically enable TCP BBR script"
echo "----------------------------------------"
echo "Press any key to start...or Press Ctrl+C to cancel"
char=$(get_char)

install_bbr
